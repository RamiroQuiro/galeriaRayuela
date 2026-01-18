import { createClient } from '@libsql/client';
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from 'baileys';
import crypto from 'crypto';
import 'dotenv/config';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './src/db/schema/index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- ALMACÉN EN MEMORIA PARA CONFIRMACIONES ---
const pendingConfirmations = new Map();

// --- UTILIDADES DE CIFRADO ---
process.on('uncaughtException', err => {
  console.error('[Baileys-Smart] Error no capturado:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Baileys-Smart] Promesa no capturada en:', promise, 'razon:', reason);
});

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32';
if (!process.env.ENCRYPTION_KEY) {
  console.warn(
    '[Crypto] ADVERTENCIA: No se detecto ENCRYPTION_KEY en .env. Usando clave por defecto.'
  );
} else {
  console.log('[Crypto] Clave de cifrado cargada correctamente.');
}
const ALGORITHM = 'aes-256-cbc';

function getKey() {
  const key = ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0');
  return Buffer.from(key);
}

function decrypt(encryptedText) {
  try {
    const key = getKey();
    console.log(
      `[Crypto-Debug] Intentando descifrar. Longitud llave: ${ENCRYPTION_KEY.length}. Key-Hint: ${ENCRYPTION_KEY.substring(0, 3)}...${ENCRYPTION_KEY.substring(ENCRYPTION_KEY.length - 3)}`
    );

    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('[Crypto] Error descifrando:', e.message);
    return null;
  }
}

// --- CONFIGURACION DB ---
const client = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_AUTH_TOKEN,
});
const db = drizzle(client);

// --- WRAPPER PARA REINTENTOS DE DB ---
async function withRetry(operation, description = 'Operation', maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (e) {
      lastError = e;
      if (e.message.includes('EAI_AGAIN') || e.message.includes('fetch failed')) {
        console.warn(
          `[DB] Reintentando ${description} (${i + 1}/${maxRetries}) por error de red...`
        );
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

// --- LIMPIEZA INICIAL ---
async function initialCleanup() {
  try {
    console.log('[Baileys-Smart] Limpiando estados fantasmas en la DB...');
    await withRetry(
      () => db.update(schema.whatsappSessions).set({ status: 'disconnected', qrCode: null }),
      'Cleanup'
    );
    console.log('[Baileys-Smart] Limpieza completada.');
  } catch (e) {
    console.error('[Baileys-Smart] ERROR CRITICO EN LIMPIEZA:', e.message);
  }
}

initialCleanup();

// --- JOB DE LIMPIEZA AUTOMÁTICA PARA TURNOS EXPIRADOS ---
async function cleanupExpiredAppointments() {
  try {
    const now = new Date();
    console.log(`[Cleanup-Job] Iniciando limpieza de turnos expirados... (${now.toLocaleString('es-AR')})`);

    // 1. Buscar turnos con fechaExpiracion vencida
    const expiredTurnos = await withRetry(
      () => db.select()
        .from(schema.turnos)
        .where(
          and(
            eq(schema.turnos.estado, 'pendiente_validacion'),
            sql`${schema.turnos.fechaExpiracion} < ${now}`
          )
        ),
      'Get Expired Turnos'
    );

    if (expiredTurnos.length === 0) {
      console.log('[Cleanup-Job] No hay turnos expirados.');
      return;
    }

    console.log(`[Cleanup-Job] Encontrados ${expiredTurnos.length} turnos expirados. Procesando...`);

    for (const turno of expiredTurnos) {
      try {
        // Marcar turno como expirado
        await withRetry(
          () => db.update(schema.turnos)
            .set({
              estado: 'cancelado', // Cambiamos a cancelado para liberar el slot
              updated_at: new Date()
            })
            .where(eq(schema.turnos.id, turno.id)),
          'Update Expired Turno'
        );

        // Buscar y actualizar la solicitud vinculada
        const solicitudes = await withRetry(
          () => db.select()
            .from(schema.whatsappSolicitudes)
            .where(eq(schema.whatsappSolicitudes.turnoId, turno.id))
            .limit(1),
          'Get Linked Solicitud'
        );

        if (solicitudes.length > 0) {
          const solicitud = solicitudes[0];

          await withRetry(
            () => db.update(schema.whatsappSolicitudes)
              .set({
                estado: 'expirada',
                updated_at: new Date()
              })
              .where(eq(schema.whatsappSolicitudes.id, solicitud.id)),
            'Update Expired Solicitud'
          );

          console.log(`[Cleanup-Job] ✅ Turno ${turno.id} y solicitud ${solicitud.id} marcados como expirados`);

          // TODO: Enviar notificación al paciente por WhatsApp
          // Necesitaríamos acceso al socket de Baileys aquí
        }
      } catch (error) {
        console.error(`[Cleanup-Job] Error procesando turno ${turno.id}:`, error.message);
      }
    }

    console.log(`[Cleanup-Job] Limpieza completada. ${expiredTurnos.length} turnos procesados.`);
  } catch (error) {
    console.error('[Cleanup-Job] Error en limpieza automática:', error.message);
  }
}

// Ejecutar limpieza cada 5 minutos
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos
setInterval(cleanupExpiredAppointments, CLEANUP_INTERVAL);
console.log(`[Cleanup-Job] Job de limpieza iniciado. Se ejecutará cada ${CLEANUP_INTERVAL / 60000} minutos.`);

// Ejecutar una vez al inicio (después de 30 segundos para dar tiempo a que todo se inicialice)
setTimeout(cleanupExpiredAppointments, 30000);

// --- PROMPT POR DEFECTO CON INSTRUCCIONES ESPECIALES ---
const HARDCODED_PROMPT = `Eres la recepcionista virtual de una clínica médica. Tu objetivo es ayudar a los pacientes de forma cálida y eficiente.
PERSONALIDAD:
- Amable, empática y conversacional
- Respuestas cortas (máximo 3-4 líneas)
- Usa emojis ocasionales: 📅 🏥 👨‍⚕️ ✅
FLUJO PARA AGENDAR TURNOS:
1. **Saludo**: "¡Hola! 👋 Soy el asistente virtual. ¿En qué puedo ayudarte?"
2. **Si pide turno**: "Con gusto te ayudo. ¿Con qué profesional te gustaría atenderte?"
3. **Mostrar disponibilidad**: Consulta la sección "DISPONIBILIDAD" que te daré. Muestra SOLO 2-3 horarios del profesional elegido.
   Ejemplo: "El Dr. Pérez tiene disponible a las 10:30, 14:00 y 16:30. ¿Cuál prefieres?"
4. **Cuando elija horario, PEDIR DATOS**:
   "Perfecto, te reservo para las 14:00 📅 Para confirmar necesito:
   • Tu DNI
   • Nombre completo
   • Obra social
   
   Podés enviarlos así: DNI: 12345678, Nombre: Juan Pérez, Obra Social: OSDE"
5. **Cuando tenga todos los datos, CONFIRMAR**:
   "Genial, tengo tus datos:
   📋 DNI: 12345678
   👤 Juan Pérez
   🏥 OSDE
   📅 Turno: Dr. Pérez - 14:00hs
   
   ¿Confirmas? Respondé 'SI' para reservar."
6. **SOLO cuando diga SI, generar la etiqueta**:
   [CONFIRMACION_TURNO_REQUERIDA]
   Profesional ID: {ID}
   Fecha y Hora: {YYYY-MM-DD HH:mm} (IMPORTANTE: Usar año actual 2026, formato exacto YYYY-MM-DD HH:mm)
   Nombre Paciente: {nombre}
   [/CONFIRMACION_TURNO_REQUERIDA]
REGLAS IMPORTANTES:
- NO estas cofigrmando un turno, eso lo hara el recepcionista o en efecto el medico , un aisstente humano.
- A los sumo comunicas se hizo el pedido de turno a la espera de confirmacion.
- NO generes la etiqueta de confirmación hasta que el paciente diga "SI"
- NO pidas todos los datos de golpe, guía paso a paso
- Si faltan datos, pide solo los que faltan
- Si no hay turnos hoy, la disponibilidad mostrará automáticamente el próximo día disponible
- NO des consejos médicos
PROFESIONALES Y DISPONIBILIDAD:
(Se agregará automáticamente)`;

// --- UTILIDADES PARA EXTRAER DETALLES DE TURNO ---
function extractTurnoDetails(text) {
  const match = text.match(
    /\[CONFIRMACION_TURNO_REQUERIDA\]\s*Profesional ID:\s*(.*?)\s*Fecha y Hora:\s*(.*?)\s*Nombre Paciente:\s*(.*?)\s*\[\/CONFIRMACION_TURNO_REQUERIDA\]/
  );

  if (!match) return null;

  return {
    profesionalId: match[1].trim(),
    fechaHora: match[2].trim(),
    nombrePaciente: match[3].trim(),
    responseText: text.replace(match[0], '').trim(), // Devuelve el texto sin la etiqueta
  };
}

// --- UTILIDADES PARA EXTRAER DATOS DE PACIENTE ---
function extractPatientData(text) {
  const datos = {
    dni: null,
    nombre: null,
    obraSocial: null,
    email: null,
    telefono: null,
  };

  // Extraer DNI
  const dniMatch = text.match(
    /(?:dni|documento|número de documento|n° documento)[:\s]*[\s#]*([0-9]{7,9})/i
  );
  if (dniMatch) datos.dni = dniMatch[1].trim();

  // Extraer nombre completo
  const nombreMatch = text.match(
    /(?:nombre|mi nombre es|soy|llamo|me llamo)[:\s]*\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]{2,50})/i
  );
  if (nombreMatch) datos.nombre = nombreMatch[1].trim();

  // Extraer obra social
  const obraMatch = text.match(
    /(?:obra social|obra|seguro|cobertura)[:\s]*\s*([a-zA-Z0-9\s]{2,50})/i
  );
  if (obraMatch) datos.obraSocial = obraMatch[1].trim();

  // Extraer email
  const emailMatch = text.match(
    /(?:email|correo|e-mail)[:\s]*\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  );
  if (emailMatch) datos.email = emailMatch[1].trim();

  return datos;
}

// --- VERIFICAR SI HAY DATOS SUFICIENTES ---
function hasRequiredPatientData(datos) {
  return datos.dni && datos.nombre && datos.obraSocial;
}

// --- UTILIDADES DE DISPONIBILIDAD (USANDO MISMAS APIS QUE WEB) ---
async function getClinicAvailability(centroId, diasABuscar = 7) {
  try {
    const profesionalesResponse = await fetch(
      `http://localhost:4322/api/public/profesionales?centroId=${centroId}`
    );
    if (!profesionalesResponse.ok) throw new Error('Error obteniendo profesionales');

    const profesionalesData = await profesionalesResponse.json();
    const profesionales = profesionalesData.data || [];
    if (profesionales.length === 0) {
      return 'No hay profesionales disponibles para reserva online.';
    }
    let primerDiaConTurnos = null;
    let infoDelDia = '';
    // Buscar en los próximos 7 días
    for (let dia = 0; dia < diasABuscar; dia++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + dia);
      const fechaStr = fecha.toISOString().split('T')[0];

      const diaNombre = dia === 0 ? 'HOY' :
        dia === 1 ? 'MAÑANA' :
          fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
      let hayTurnosEsteDia = false;
      let tempInfo = `DISPONIBILIDAD PARA ${diaNombre}:\n\n`;
      for (const profesional of profesionales) {
        try {
          const disponibilidadResponse = await fetch(
            `http://localhost:4322/api/public/disponibilidad?centroId=${centroId}&profesionalId=${profesional.id}&fecha=${fechaStr}`
          );
          if (disponibilidadResponse.ok) {
            const disponibilidadData = await disponibilidadResponse.json();
            const slots = disponibilidadData.data || [];
            if (slots.length > 0) {
              hayTurnosEsteDia = true;

              const horariosLegibles = slots.slice(0, 3).map(slotISO => {
                const date = new Date(slotISO);
                return date.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
              });
              tempInfo += `- ${profesional.abreviatura} ${profesional.nombre} ${profesional.apellido} (ID: ${profesional.id})\n`;
              tempInfo += `  Especialidad: ${profesional.especialidad || 'Médico General'}\n`;
              tempInfo += `  ✅ ${horariosLegibles.join(', ')}`;
              if (slots.length > 3) tempInfo += ` y ${slots.length - 3} más`;
              tempInfo += `\n\n`;
            }
          }
        } catch (error) {
          console.error(`[Availability] Error ${profesional.id}:`, error.message);
        }
      }
      if (hayTurnosEsteDia) {
        if (!primerDiaConTurnos) {
          primerDiaConTurnos = diaNombre;
          infoDelDia = tempInfo;
        }
        // Si es hoy o mañana y hay turnos, retornar inmediatamente
        if (dia <= 1) return tempInfo;
      }
    }
    // Si no hay hoy ni mañana, pero sí más adelante
    if (primerDiaConTurnos && primerDiaConTurnos !== 'HOY' && primerDiaConTurnos !== 'MAÑANA') {
      return `No hay turnos para hoy ni mañana.\n\n${infoDelDia}`;
    }
    return primerDiaConTurnos ? infoDelDia : 'No hay turnos disponibles en los próximos días.';
  } catch (e) {
    console.error('[Availability] Error:', e.message);
    return 'Error consultando disponibilidad.';
  }
}

// --- GESTIÓN DE CLIENTES BAILEYS ---
const clients = new Map();

async function getOrCreateBaileysClient(centroMedicoId) {
  const id = String(centroMedicoId);
  if (clients.has(id)) {
    console.log(`[Baileys-Smart] El cliente ${id} ya existe. Estado: ${clients.get(id).state}`);
    return clients.get(id);
  }

  console.log(`[Baileys-Smart] Iniciando nuevo cliente Baileys para centro: ${id}`);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(
      path.join(__dirname, `.baileys_auth_${id}`)
    );

    const { version } = await fetchLatestBaileysVersion();
    console.log(`[Baileys-Smart] Usando WhatsApp Web v${version}`);

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: state.keys,
      },
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 3000,
      keepAliveIntervalMs: 30000,
    });

    // Manejo de eventos
    sock.ev.on('connection.update', async update => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[Baileys-Smart] QR generado para centro: ${id}`);
        try {
          await withRetry(
            () =>
              db
                .update(schema.whatsappSessions)
                .set({ qrCode: qr, status: 'qr_pending', updated_at: new Date() })
                .where(eq(schema.whatsappSessions.centroMedicoId, id)),
            'Update QR'
          );
        } catch (e) {
          console.error('[Baileys-Smart] Error actualizando QR en DB:', e.message);
        }
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(
          `[Baileys-Smart] Conexión cerrada para centro ${id}. Reconnect: ${shouldReconnect}`
        );

        if (shouldReconnect) {
          clients.delete(id);
          setTimeout(() => getOrCreateBaileysClient(centroMedicoId), 5000);
        } else {
          await withRetry(
            () =>
              db
                .update(schema.whatsappSessions)
                .set({ status: 'disconnected', qrCode: null, updated_at: new Date() })
                .where(eq(schema.whatsappSessions.centroMedicoId, id)),
            'Update Disconnected'
          );
        }
      }

      if (connection === 'open') {
        console.log(`[Baileys-Smart] Cliente conectado para centro: ${id}`);
        try {
          await withRetry(
            () =>
              db
                .update(schema.whatsappSessions)
                .set({
                  status: 'connected',
                  qrCode: null,
                  fechaUltimaConexion: new Date(),
                  updated_at: new Date(),
                })
                .where(eq(schema.whatsappSessions.centroMedicoId, id)),
            'Update Connected'
          );
        } catch (e) {
          console.error('[Baileys-Smart] Error actualizando connected en DB:', e.message);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      const message = messages[0];
      if (!message.message || message.key.fromMe) return;

      // Ignorar SOLO grupos reales y broadcasts
      // @lid y @newsletter son contactos válidos (no grupos)
      console.log(`[Baileys-Smart] 🔍 Analizando JID: ${message.key.remoteJid}`);

      if (
        message.key.remoteJid.includes('@g.us') || // Grupos (siempre bloquear)
        message.key.remoteJid.includes('@broadcast') // Broadcasts (siempre bloquear)
      ) {
        console.log(
          `[Baileys-Smart] ❌ BLOQUEADO - Grupo/Broadcast real: ${message.key.remoteJid}`
        );
        return;
      }

      // Ignorar mensajes de status
      if (message.message?.statusMessage) {
        console.log(`[Baileys-Smart] ❌ BLOQUEADO - Status: ${message.key.remoteJid}`);
        return;
      }

      console.log(`[Baileys-Smart] ✅ MENSAJE RECIBIDO: ${message.key.remoteJid}`);
      try {
        const msgContent =
          message.message.conversation || message.message.extendedTextMessage?.text || '';

        console.log(`[Baileys-Smart] 📝 Contenido: "${msgContent}"`);
        console.log(`[Baileys-Smart] 🏷️ Tipo: ${Object.keys(message.message || {})}`);
        console.log(`[Baileys-Smart] 👤 PushName: ${message.pushName || 'sin nombre'}`);
        console.log(`[Baileys-Smart] 📏 Longitud: ${msgContent?.length || 0}`);

        // Ignorar mensajes vacíos o muy cortos
        if (!msgContent || msgContent.trim().length < 2) {
          console.log(
            `[Baileys-Smart] ❌ BLOQUEADO - Vacío/Corto: "${msgContent}" (longitud: ${msgContent?.length || 0})`
          );
          return;
        }

        // Anti-loop: Ignorar si el mensaje parece ser una respuesta automática
        const isAutoResponse =
          msgContent.includes('¡Gracias! Su solicitud ha sido registrada') ||
          msgContent.includes('Hemos notado que ya tiene una solicitud') ||
          msgContent.includes("Responda 'SI' para confirmar") ||
          msgContent.includes('Con gusto te asisto') ||
          msgContent.includes('Hola! Con gusto te asisto') ||
          msgContent.includes('Su solicitud ha sido registrada');

        if (isAutoResponse) {
          console.log(
            `[Baileys-Smart] ❌ BLOQUEADO - Auto Response: "${msgContent.substring(0, 50)}..."`
          );
          return;
        }

        // MANEJO DE CONFIRMACIÓN DE TURNO
        if (
          pendingConfirmations.has(message.key.remoteJid) &&
          msgContent.toLowerCase().trim() === 'si'
        ) {
          const details = pendingConfirmations.get(message.key.remoteJid);
          console.log(`[Baileys-Smart] Usuario confirmando turno. Detalles:`, details);

          // Extraer datos del paciente de mensajes anteriores
          const conversacion = await withRetry(
            () =>
              db
                .select()
                .from(schema.whatsappMensajes)
                .where(
                  and(
                    eq(schema.whatsappMensajes.conversacionId, details.conversacionId),
                    eq(schema.whatsappMensajes.direccion, 'incoming')
                  )
                )
                .orderBy(schema.whatsappMensajes.timestamp)
                .limit(10),
            'Get Conversation History'
          );

          let datosPaciente = {
            dni: null,
            nombre: details.nombrePaciente || message.pushName,
            obraSocial: null,
            email: null,
            telefono: message.key.remoteJid,
          };

          // Buscar datos en los mensajes anteriores
          for (const msg of conversacion.reverse()) {
            const datosExtraidos = extractPatientData(msg.contenido);
            if (datosExtraidos.dni) datosPaciente.dni = datosExtraidos.dni;
            if (datosExtraidos.nombre) datosPaciente.nombre = datosExtraidos.nombre;
            if (datosExtraidos.obraSocial) datosPaciente.obraSocial = datosExtraidos.obraSocial;
            if (datosExtraidos.email) datosPaciente.email = datosExtraidos.email;
          }

          console.log(`[Baileys-Smart] Datos extraídos:`, datosPaciente);

          // Verificar si tenemos todos los datos necesarios
          if (!hasRequiredPatientData(datosPaciente)) {
            console.log(`[Baileys-Smart] Faltan datos del paciente`);

            const faltantes = [];
            if (!datosPaciente.dni) faltantes.push('DNI');
            if (!datosPaciente.nombre) faltantes.push('nombre completo');
            if (!datosPaciente.obraSocial) faltantes.push('obra social');

            await safeSendMessage(
              sock,
              message.key.remoteJid,
              `Para confirmar su turno, necesito algunos datos adicionales:\n\n❌ *Faltante:* ${faltantes.join(', ')}\n\nPor favor, envíe:\n• Su DNI (7-8 dígitos)\n• Su nombre completo\n• Su obra social\n• Su email (opcional)\n\nEjemplo: "DNI: 12345678, Nombre: Juan Pérez, Obra Social: Osde, Email: juan@email.com"`
            );
            return;
          }

          // ✅ VALIDAR Y CORREGIR FECHA
          let fechaTurnoValida;
          try {
            // Intentar parsear la fecha que envió la IA
            let fechaStr = details.fechaHora;

            // Si la fecha no tiene año correcto o está en formato incorrecto, corregirla
            const hoy = new Date();
            const añoActual = hoy.getFullYear();

            // Extraer hora del string (formato: "HH:mm" o "YYYY-MM-DD HH:mm")
            const horaMatch = fechaStr.match(/(\d{1,2}):(\d{2})/);
            if (!horaMatch) {
              throw new Error('No se pudo extraer la hora');
            }

            const hora = parseInt(horaMatch[1]);
            const minuto = parseInt(horaMatch[2]);

            // Intentar extraer fecha (YYYY-MM-DD o DD-MM-YYYY)
            const fechaMatch = fechaStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);

            if (fechaMatch) {
              let año = parseInt(fechaMatch[1]);
              const mes = parseInt(fechaMatch[2]) - 1; // JS months are 0-indexed
              const dia = parseInt(fechaMatch[3]);

              // Si el año es viejo (< 2024), usar año actual
              if (año < 2024) {
                año = añoActual;
              }

              fechaTurnoValida = new Date(año, mes, dia, hora, minuto);
            } else {
              // Si no hay fecha, asumir HOY
              fechaTurnoValida = new Date(añoActual, hoy.getMonth(), hoy.getDate(), hora, minuto);
            }

            // Validar que la fecha no sea en el pasado
            if (fechaTurnoValida < hoy) {
              // Si es en el pasado, mover al día siguiente
              fechaTurnoValida.setDate(fechaTurnoValida.getDate() + 1);
            }

            console.log(`[Baileys-Smart] Fecha original: ${details.fechaHora}`);
            console.log(`[Baileys-Smart] Fecha corregida: ${fechaTurnoValida.toISOString()}`);

          } catch (dateError) {
            console.error(`[Baileys-Smart] Error parseando fecha: ${dateError.message}`);
            await safeSendMessage(
              sock,
              message.key.remoteJid,
              '❌ Hubo un error con la fecha del turno. Por favor, volvé a solicitar el turno.'
            );
            return;
          }

          // ✅ CREAR TURNO TEMPORAL PARA BLOQUEAR EL SLOT
          const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
          const turnoId = crypto.randomUUID();

          try {
            await withRetry(
              () => db.insert(schema.turnos).values({
                id: turnoId,
                centroMedicoId: id,
                userMedicoId: details.profesionalId,
                fechaTurno: fechaTurnoValida,
                horaAtencion: fechaTurnoValida.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }),
                duracion: 30,
                estado: 'pendiente_validacion',
                origen: 'whatsapp',
                fechaExpiracion: expiresAt,
                datosPacienteTemporal: JSON.stringify({
                  nombre: datosPaciente.nombre,
                  dni: datosPaciente.dni,
                  obraSocial: datosPaciente.obraSocial,
                  email: datosPaciente.email,
                  telefono: message.key.remoteJid,
                }),
              }),
              'Crear Turno Temporal'
            );

            console.log(`[Baileys-Smart] ✅ Turno temporal creado: ${turnoId} - Slot bloqueado por 30 min`);
          } catch (turnoError) {
            console.error(`[Baileys-Smart] ❌ Error creando turno temporal:`, turnoError.message);
            await safeSendMessage(
              sock,
              message.key.remoteJid,
              '❌ Lo sentimos, ese horario acaba de ser ocupado. Por favor, solicite otro turno.'
            );
            return;
          }

          // Crear solicitud completa con TTL
          const newSolicitud = {
            id: details.solicitudId || crypto.randomUUID(),
            centroMedicoId: id,
            numeroTelefono: message.key.remoteJid,
            nombrePaciente: datosPaciente.nombre,
            dni: datosPaciente.dni,
            obraSocial: datosPaciente.obraSocial,
            email: datosPaciente.email,
            datosCompletos: true,
            userMedicoId: details.profesionalId,
            fechaHora: details.fechaHora,
            turnoId: turnoId, // ✅ Vincular con el turno real
            estado: 'pendiente',
            expiresAt: Math.floor(expiresAt.getTime() / 1000),
            mensajeOriginal: details.mensajeOriginal,
          };

          await withRetry(
            () => db.insert(schema.whatsappSolicitudes).values(newSolicitud),
            'Insertar Solicitud Completa'
          );

          pendingConfirmations.delete(message.key.remoteJid);

          const replyMsg = `✅ *SOLICITUD RECIBIDA*\n\n📅 *Fecha y Hora:* ${new Date(details.fechaHora).toLocaleString('es-AR')}\n👨‍⚕️ *Profesional:* ${details.profesionalId}\n👤 *Paciente:* ${datosPaciente.nombre}\n🆔 *DNI:* ${datosPaciente.dni}\n🏥 *Obra Social:* ${datosPaciente.obraSocial}\n\n⏰ *Su solicitud expira en 30 minutos*\nNuestro equipo de recepción revisará su solicitud y la confirmará. Le responderemos a la brevedad.`;

          await safeSendMessage(sock, message.key.remoteJid, replyMsg);

          // Notificar al frontend via SSE
          fetch(`http://localhost:4322/api/whatsapp/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:4322' },
            body: JSON.stringify({
              tipo: 'nueva_solicitud_whatsapp',
              centroMedicoId: id,
              payload: newSolicitud,
            }),
          }).catch(() => { });

          console.log(
            `[Baileys-Smart] Solicitud completa creada para ${message.key.remoteJid} y notificada.`
          );
          return;
        }

        // Guardar conversación/mensaje
        let conversacion = await withRetry(
          () =>
            db
              .select()
              .from(schema.whatsappConversaciones)
              .where(
                and(
                  eq(schema.whatsappConversaciones.centroMedicoId, id),
                  eq(schema.whatsappConversaciones.numeroTelefono, message.key.remoteJid)
                )
              )
              .limit(1),
          'Get Conversation'
        );

        let convId;
        if (conversacion.length === 0) {
          convId = crypto.randomUUID();
          await withRetry(
            () =>
              db.insert(schema.whatsappConversaciones).values({
                id: convId,
                centroMedicoId: id,
                numeroTelefono: message.key.remoteJid,
                nombrePaciente: message.pushName || 'Paciente',
                ultimoMensaje: msgContent.substring(0, 200),
                updated_at: new Date(),
              }),
            'Insert Conversation'
          );

          conversacion = await withRetry(
            () =>
              db
                .select()
                .from(schema.whatsappConversaciones)
                .where(eq(schema.whatsappConversaciones.id, convId))
                .limit(1),
            'Get New Conversation'
          );
        } else {
          convId = conversacion[0].id;
          await withRetry(
            () =>
              db
                .update(schema.whatsappConversaciones)
                .set({
                  ultimoMensaje: msgContent.substring(0, 200),
                  updated_at: new Date(),
                })
                .where(eq(schema.whatsappConversaciones.id, convId)),
            'Update Conversation'
          );
        }

        // Guardar mensaje
        await withRetry(
          () =>
            db.insert(schema.whatsappMensajes).values({
              id: crypto.randomUUID(),
              conversacionId: conversacion[0]?.id || convId,
              direccion: 'incoming',
              contenido: msgContent,
              messageType: 'conversation',
              timestamp: new Date(message.messageTimestamp * 1000),
            }),
          'Insert Message'
        );

        // (ANTI-SPAM) Verificar si ya hay una solicitud pendiente
        const existingRequest = await withRetry(
          () =>
            db
              .select()
              .from(schema.whatsappSolicitudes)
              .where(
                and(
                  eq(schema.whatsappSolicitudes.numeroTelefono, message.key.remoteJid),
                  eq(schema.whatsappSolicitudes.estado, 'pendiente')
                )
              )
              .limit(1),
          'Check Existing Request'
        );

        if (existingRequest.length > 0) {
          console.log(
            `[Baileys-Smart] ${message.key.remoteJid} ya tiene ${existingRequest.length} solicitudes pendientes. Solicitud ID: ${existingRequest[0].id}`
          );

          await safeSendMessage(
            sock,
            message.key.remoteJid,
            'Hemos notado que ya tiene una solicitud de turno pendiente de aprobación. Nuestro equipo de recepción se pondrá en contacto con usted a la brevedad.'
          );

          return;
        }

        // Notificar a Astro para que emita el SSE
        fetch(`http://localhost:4322/api/whatsapp/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:4322',
          },
          body: JSON.stringify({
            tipo: 'nuevo_mensaje',
            centroMedicoId: id,
            payload: {
              from: message.key.remoteJid,
              body: msgContent,
              nombre: message.pushName || 'Paciente',
            },
          }),
        }).catch(() => { });

        // Intentar respuesta automática con IA
        await tryAIResponse(id, { from: message.key.remoteJid, body: msgContent }, sock);
      } catch (e) {
        console.error('[Baileys-Smart] Error procesando mensaje:', e.message);
      }
    });

    clients.set(id, sock);
    return sock;
  } catch (error) {
    console.error(`[Baileys-Smart] Error creando cliente para centro ${id}:`, error.message);
    throw error;
  }
}

// --- SAFE SEND WRAPPER PARA BAILEYS (SIMPLIFICADO) ---
async function safeSendMessage(sock, number, message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Baileys-Smart-SafeSend] Intento ${attempt}: Enviando a ${number}`);

      if (sock.user && sock.ws) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));

        const result = await sock.sendMessage(number, { text: message });
        console.log(`[Baileys-Smart-SafeSend] ✅ Enviado exitosamente (intento ${attempt})`);
        return result;
      } else {
        throw new Error('Socket no está completamente conectado');
      }
    } catch (error) {
      console.error(`[Baileys-Smart-SafeSend] ❌ Intento ${attempt} fallado: ${error.message}`);

      if (attempt === maxRetries) {
        console.error(`[Baileys-Smart-SafeSend] 🚫 Todos los intentos fallaron para ${number}`);
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt * 2));
    }
  }
}

// --- IA RESPONSE CON DETECCIÓN DE TURNO ---
async function tryAIResponse(centroId, message, sock) {
  try {
    const session = await withRetry(
      () =>
        db
          .select()
          .from(schema.whatsappSessions)
          .where(eq(schema.whatsappSessions.centroMedicoId, centroId))
          .limit(1),
      'Get Session Context'
    );
    if (session.length === 0 || !session[0].aiActive) return;

    console.log(`[Baileys-Smart-AI] Procesando respuesta para centro ${centroId}...`);

    const credentials = await withRetry(
      () =>
        db
          .select()
          .from(schema.aiCredentials)
          .where(
            and(
              eq(schema.aiCredentials.centroMedicoId, centroId),
              eq(schema.aiCredentials.isActive, true)
            )
          )
          .limit(1),
      'Get AI Credentials'
    );

    if (credentials.length === 0) {
      console.warn(`[Baileys-Smart-AI] No hay credenciales activas para el centro ${centroId}`);
      return;
    }

    const config = credentials[0];
    console.log(`[Baileys-Smart-AI] Config: ${config.provider}, Modelo: ${config.model}`);
    const apiKey = decrypt(config.apiKeyEncrypted);

    const profesionales = await withRetry(
      () =>
        db
          .select({
            id: schema.users.id,
            nombre: schema.users.nombre,
            apellido: schema.users.apellido,
            especialidad: schema.users.especialidad,
          })
          .from(schema.users)
          .innerJoin(
            schema.usersCentrosMedicos,
            eq(schema.users.id, schema.usersCentrosMedicos.userId)
          )
          .where(
            and(
              eq(schema.usersCentrosMedicos.centroMedicoId, centroId),
              eq(schema.usersCentrosMedicos.rolEnCentro, 'profesional'),
              eq(schema.usersCentrosMedicos.activo, true)
            )
          ),
      'Get Professionals'
    );

    const listaProfesionales = profesionales
      .map(
        p =>
          `- ${p.nombre} ${p.apellido} (ID: ${p.id}, Especialidad: ${p.especialidad || 'General'})`
      )
      .join('\n');

    const disponibilidadHoy = await getClinicAvailability(centroId);

    const systemPrompt =
      HARDCODED_PROMPT +
      `\n\nPROFESIONALES DISPONIBLES EN LA CLINICA:\n${listaProfesionales}` +
      `\n\n${disponibilidadHoy}`;

    let aiResponseText = '';

    if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUsuario dice: ${message.body}` }] }],
        }),
      });
      const data = await resp.json();
      if (data.error) {
        console.error(
          `[Baileys-Smart-AI-Gemini] Error: ${data.error.message || JSON.stringify(data.error)}`
        );
      }
      aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (config.provider === 'openai') {
      const url = 'https://api.openai.com/v1/chat/completions';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message.body },
          ],
        }),
      });
      const data = await resp.json();
      if (data.error) {
        console.error(
          `[Baileys-Smart-AI-OpenAI] Error: ${data.error.message || JSON.stringify(data.error)}`
        );
      }
      aiResponseText = data.choices?.[0]?.message?.content;
    } else if (config.provider === 'groq') {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message.body },
          ],
        }),
      });
      const data = await resp.json();
      if (data.error)
        console.error(
          `[Baileys-Smart-AI-Groq] Error: ${data.error.message || JSON.stringify(data.error)}`
        );
      aiResponseText = data.choices?.[0]?.message?.content;
    } else if (config.provider === 'deepseek') {
      const url = 'https://api.deepseek.com/chat/completions';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message.body },
          ],
        }),
      });
      const data = await resp.json();
      if (data.error)
        console.error(
          `[Baileys-Smart-AI-DeepSeek] Error: ${data.error.message || JSON.stringify(data.error)}`
        );
      aiResponseText = data.choices?.[0]?.message?.content;
    }

    if (aiResponseText) {
      const turnoDetails = extractTurnoDetails(aiResponseText);

      if (turnoDetails) {
        console.log(
          `[Baileys-Smart-Flow] IA detectó una solicitud de turno. Pidiendo confirmación a ${message.from}`
        );

        // Primero guardar conversación para obtener convId
        let conversacion = await withRetry(
          () =>
            db
              .select()
              .from(schema.whatsappConversaciones)
              .where(
                and(
                  eq(schema.whatsappConversaciones.centroMedicoId, centroId),
                  eq(schema.whatsappConversaciones.numeroTelefono, message.from)
                )
              )
              .limit(1),
          'Get Conversation'
        );

        let convId;
        if (conversacion.length === 0) {
          convId = crypto.randomUUID();
          await withRetry(
            () =>
              db.insert(schema.whatsappConversaciones).values({
                id: convId,
                centroMedicoId: centroId,
                numeroTelefono: message.from,
                nombrePaciente: 'Paciente',
                ultimoMensaje: aiResponseText.substring(0, 200),
                updated_at: new Date(),
              }),
            'Insert Conversation'
          );
        } else {
          convId = conversacion[0].id;
          await withRetry(
            () =>
              db
                .update(schema.whatsappConversaciones)
                .set({
                  ultimoMensaje: aiResponseText.substring(0, 200),
                  updated_at: new Date(),
                })
                .where(eq(schema.whatsappConversaciones.id, convId)),
            'Update Conversation'
          );
        }

        // Crear solicitud inicial pendiente
        const solicitudId = crypto.randomUUID();

        // Guardar en memoria para esperar el "SI"
        pendingConfirmations.set(message.from, {
          ...turnoDetails,
          mensajeOriginal: message.body,
          conversacionId: convId, // Guardar ID de conversación
          solicitudId: solicitudId, // Guardar ID para referenciar
        });

        // Guardar solicitud inicial en BD (incompleta)
        const initialSolicitud = {
          id: solicitudId,
          centroMedicoId: centroId,
          numeroTelefono: message.from,
          nombrePaciente: turnoDetails.nombrePaciente || 'Paciente',
          userMedicoId: turnoDetails.profesionalId,
          fechaHora: turnoDetails.fechaHora,
          estado: 'pendiente',
          datosCompletos: false, // Incompleta hasta que confirme con "SI"
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos desde ahora
          mensajeOriginal: message.body,
        };

        await withRetry(
          () => db.insert(schema.whatsappSolicitudes).values(initialSolicitud),
          'Insertar Solicitud Inicial'
        );

        // Enviar el mensaje de la IA + la pregunta de confirmación
        await safeSendMessage(sock, message.from, turnoDetails.responseText);
        await safeSendMessage(
          sock,
          message.from,
          "Responda 'SI' para confirmar su solicitud. De lo contrario, puede ignorar este mensaje."
        );
      } else {
        console.log(
          `[Baileys-Smart-AI] Enviando respuesta estándar a ${message.from}: ${aiResponseText.substring(0, 50)}...`
        );
        await safeSendMessage(sock, message.from, aiResponseText);
        console.log(`[Baileys-Smart-AI] Respuesta estándar enviada con éxito.`);
      }
    } else {
      console.warn(`[Baileys-Smart-AI] No se generó texto de respuesta.`);
    }
  } catch (err) {
    console.error('[Baileys-Smart-AI] Error:', err.message);
  }
}

// --- SERVIDOR HTTP ---
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/init' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
      try {
        const { centroMedicoId } = JSON.parse(body);
        if (!centroMedicoId) throw new Error('centroMedicoId requerido');

        await getOrCreateBaileysClient(centroMedicoId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'success',
            msg: 'Baileys Smart session initialization triggered',
          })
        );
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', msg: e.message }));
      }
    });
  } else if (url.pathname === '/disconnect' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
      try {
        const { centroMedicoId } = JSON.parse(body);
        const id = String(centroMedicoId);
        const client = clients.get(id);

        if (client) {
          console.log(`[Baileys-Smart] Desconectando cliente centro: ${id}`);
          try {
            client.ws.close();
          } catch (e) {
            console.warn(`[Baileys-Smart] Error cerrando conexión: ${e.message}`);
          }
          clients.delete(id);
        }

        await db
          .update(schema.whatsappSessions)
          .set({ status: 'disconnected', qrCode: null, updated_at: new Date() })
          .where(eq(schema.whatsappSessions.centroMedicoId, id));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', msg: 'Disconnected successfully' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', msg: e.message }));
      }
    });
  } else if (url.pathname === '/status' && req.method === 'GET') {
    const centroMedicoId = url.searchParams.get('centroMedicoId');
    const client = clients.get(centroMedicoId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'success',
        connected: !!client,
        clientStatus: client ? 'active' : 'inactive',
      })
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 5003; // Puerto diferente para el smart
server.listen(PORT, () => {
  console.log(`\x1b[32m%s\x1b[0m`, `[Baileys-Smart-Server] Corriendo en http://localhost:${PORT}`);
  console.log(
    `[Baileys-Smart-Server] Usando Baileys con flujo inteligente de confirmación de turnos`
  );
});
