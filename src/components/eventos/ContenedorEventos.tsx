import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import ModalReact from "../ui/organismo/ModalReact";
import { CreateEventForm } from "../CreateEventForm";
import { GuiaInicio } from "../dashboard/GuiaInicio";
import {
  type Event,
  eventsStore,
  setEvents,
  traerEventos,
} from "../../store/eventsStore";
import {
  Calendar,
  Plus,
  Printer,
  Eye,
  Edit,
  Trash,
  Smartphone,
  Monitor,
  Trophy,
  MessageSquare,
  Star,
} from "lucide-react";
import Button from "../ui/Button";
// Button.astro import removed as it cannot be used in React

interface ContenedorEventosProps {
  initialEvents: Event[];
}

export default function ContenedorEventos({
  initialEvents = [],
}: ContenedorEventosProps) {
  const misEventos = useStore(eventsStore);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEvents(initialEvents);
    } else {
      traerEventos();
    }
  }, []);

  const handleEliminar = async (id: number, name: string) => {
    if (confirm(`¿Eliminar evento "${name}"?`)) {
      try {
        await fetch(`/api/events/${id}`, { method: "DELETE" });
        traerEventos();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleWhatsApp = async (id: number) => {
    try {
      const res = await fetch(`/api/eventos/${id}/toggle-whatsapp`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        traerEventos();
      } else {
        alert(data.message || "Error al activar WhatsApp");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  const handleTogglePrincipal = async (id: number) => {
    try {
      const res = await fetch(`/api/eventos/${id}/toggle-principal`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        traerEventos();
      } else {
        alert(data.message || "Error al establecer evento principal");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  const closeModal = () => setEditingEvent(null);

  if (misEventos.length === 0) {
    return (
      <div className="flex flex-col items-center">
        <GuiaInicio />

        <div className="mt-8">
          <a
            href="/events/create"
            className="inline-flex bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg px-8 py-4 rounded-xl font-bold text-white text-base hover:scale-105 transition glass-button"
          >
            Comenzar Ahora - Crear mi Primer Evento
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {misEventos.map((event) => (
          <div
            key={event.id}
            className="group flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-xl h-full overflow-hidden glass-card"
          >
            {/* Event Header/Image */}
            <div className="relative bg-gray-800 h-48 overflow-hidden">
              {event.imagenPortada ? (
                <img
                  src={event.imagenPortada}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex justify-center items-center bg-linear-to-br from-gray-800 group-hover:from-gray-700 to-gray-900 group-hover:to-gray-800 w-full h-full transition-colors">
                  <Calendar className="w-12 h-12 text-gray-600" />
                </div>
              )}

              <div className="top-4 right-4 absolute">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md border border-white/10 ${
                    event.estado === "activo"
                      ? "bg-green-500/20 text-green-200"
                      : event.estado === "finalizado"
                        ? "bg-gray-500/20 text-gray-200"
                        : "bg-yellow-500/20 text-yellow-200"
                  }`}
                >
                  {event.estado?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Event details */}
            <div className="flex flex-col flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <h3
                  className="pr-2 font-bold text-white text-xl truncate"
                  title={event.name}
                >
                  {event.name}
                </h3>
                <Button
                  onClick={() => handleToggleWhatsApp(event.id)}
                  title={
                    event.whatsappActivo
                      ? "WhatsApp Vinculado"
                      : "Vincular WhatsApp"
                  }
                  className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 ${
                    event.whatsappActivo
                      ? "bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                      : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Smartphone
                    className={`h-4 w-4 ${event.whatsappActivo ? "animate-pulse" : ""}`}
                  />
                  <span className="font-black text-[10px] uppercase tracking-tighter">
                    WA {event.whatsappActivo ? "ON" : "OFF"}
                  </span>
                </Button>

                <Button
                  onClick={() => handleTogglePrincipal(event.id)}
                  title={
                    event.esPrincipal
                      ? "Evento Principal (QR Permanente)"
                      : "Marcar como Principal para QR Permanente"
                  }
                  className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 ${
                    event.esPrincipal
                      ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                      : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${event.esPrincipal ? "fill-current" : ""}`}
                  />
                  <span className="font-black text-[10px] text-center uppercase tracking-tighter">
                    QR FIJO <br /> {event.esPrincipal ? "ACTIVO" : "VINCULAR"}
                  </span>
                </Button>
              </div>

              <div className="flex flex-col gap-3 mt-auto pt-4 border-white/10 border-t">
                {/* Primary Actions - The Flow */}
                <div className="gap-2 grid grid-cols-3">
                  <a
                    href={`/dashboard/eventos/${event.codigoAcceso}/poster`}
                    className="group/btn flex flex-col justify-center items-center gap-1 bg-white/5 hover:bg-white/10 p-2 rounded-lg text-gray-300 hover:text-white transition-all"
                    title="Paso 2: Imprimir QR"
                  >
                    <Printer className="w-5 h-5 text-neon-purple group-hover/btn:scale-110 transition-transform" />
                    <span className="font-bold text-[10px] uppercase tracking-wide">
                      Poster
                    </span>
                  </a>

                  <a
                    href={`/eventos/${event.codigoAcceso}/subir`}
                    target="_blank"
                    className="group/btn flex flex-col justify-center items-center gap-1 bg-white/5 hover:bg-white/10 p-2 rounded-lg text-gray-300 hover:text-white transition-all"
                    title="Paso 3: Subir Fotos"
                  >
                    <Plus className="w-5 h-5 text-neon-pink group-hover/btn:scale-110 transition-transform" />
                    <span className="font-bold text-[10px] uppercase tracking-wide">
                      Subir
                    </span>
                  </a>

                  <button
                    onClick={() => {
                      const width = window.screen.width;
                      const height = window.screen.height;
                      const features = `
                        width=${width},
                        height=${height},
                        left=0,
                        top=0,
                        fullscreen=yes,
                        toolbar=no,
                        menubar=no,
                        scrollbars=no,
                        resizable=no,
                        location=no,
                        status=no
                      `;
                      window.open(`/events/${event.codigoAcceso}/fullscreen`, `galeria_${event.codigoAcceso}`, features);
                    }}
                    className="group/btn flex flex-col justify-center items-center gap-1 bg-white/5 hover:bg-white/10 p-2 rounded-lg text-gray-300 hover:text-white transition-all"
                    title="Paso 4: Ver Galería"
                  >
                    <Eye className="w-5 h-5 text-neon-blue group-hover/btn:scale-110 transition-transform" />
                    <span className="font-bold text-[10px] uppercase tracking-wide">
                      Ver
                    </span>
                  </button>

                  <a
                    href={`/proyector/${event.codigoAcceso}`}
                    target="_blank"
                    className="group/btn flex flex-col flex-1 justify-center items-center gap-1 bg-blue-600/20 hover:bg-blue-600/40 p-2 border border-blue-500/30 rounded-lg text-blue-100 hover:text-white text-center transition-all"
                    title="Proyección Combinada (Fotos + Mensajes)"
                  >
                    <Monitor className="w-5 h-5 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-bold text-[9px] uppercase tracking-tight">
                      Proyectar
                    </span>
                  </a>

                  <a
                    href={`/proyector/${event.codigoAcceso}?display=messages`}
                    target="_blank"
                    className="group/btn flex flex-col flex-1 justify-center items-center gap-1 bg-zinc-800/40 hover:bg-zinc-800/60 p-2 border border-white/5 rounded-lg text-zinc-400 hover:text-white text-center transition-all"
                    title="Solo Muro de Mensajes"
                  >
                    <MessageSquare className="w-5 h-5 text-zinc-500 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-bold text-[9px] uppercase tracking-tight">
                      Solo Mensajes
                    </span>
                  </a>
                </div>

                {/* Secondary Actions - Admin */}
                <div className="flex justify-between items-center pt-2 border-white/5 border-t">
                  <span className="font-mono text-[10px] text-gray-600">
                    ID: {event.codigoAcceso}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingEvent(event)}
                      className="flex items-center gap-1 hover:bg-white/5 p-2 rounded-lg text-gray-500 hover:text-white transition-all"
                      title="Editar Configuración"
                    >
                      <Edit className="w-3 h-3" />
                      <span className="text-[10px]">Editar</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          confirm("¿Lanzar sorteo ahora? Se verá en pantalla.")
                        ) {
                          const res = await fetch(
                            `/api/eventos/live/${event.id}/draw`,
                            { method: "POST" },
                          );
                          const data = await res.json();
                          if (res.ok)
                            alert(
                              `¡Sorteo realizado! Ganador: ${data.data.winnerNumber}`,
                            );
                          else alert(data.message);
                        }
                      }}
                      className="flex items-center gap-1 hover:bg-yellow-500/10 p-2 rounded-lg text-gray-500 hover:text-yellow-400 transition-all"
                      title="Lanzar Sorteo"
                    >
                      <Trophy className="w-3 h-3" />
                      <span className="text-[10px]">Sorteo</span>
                    </button>
                    <button
                      onClick={() => handleEliminar(event.id, event.name)}
                      className="flex items-center gap-1 hover:bg-red-500/10 p-2 rounded-lg text-gray-600 hover:text-red-400 transition-all"
                      title="Mover a Papelera"
                    >
                      <Trash className="w-3 h-3" />
                      <span className="text-[10px]">Borrar</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `¿Estás SEGURO de querer borrar TODOS los mensajes de "${event.name}"? Esta acción no se puede deshacer.`,
                          )
                        ) {
                          try {
                            const res = await fetch(
                              `/api/eventos/${event.id}/mensajes/reset`,
                              { method: "DELETE" },
                            );
                            if (res.ok) {
                              alert("Mensajes eliminados correctamente");
                            } else {
                              const data = await res.json();
                              alert(
                                data.message || "Error al eliminar mensajes",
                              );
                            }
                          } catch (e) {
                            console.error(e);
                            alert("Error de conexión");
                          }
                        }
                      }}
                      className="flex items-center gap-1 hover:bg-orange-500/10 p-2 rounded-lg text-gray-600 hover:text-orange-500 transition-all"
                      title="Resetear Mensajes (Limpiar Muro)"
                    >
                      <Trash className="w-3 h-3" />
                      <span className="text-[10px]">Reset Msj</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingEvent && (
        <ModalReact
          onClose={closeModal}
          title="Editar Evento"
          id="modal-editar-evento"
        >
          <CreateEventForm
            initialData={editingEvent}
            onSuccess={() => {
              traerEventos(); // Refresh list just in case, though store should update
              closeModal();
            }}
          />
        </ModalReact>
      )}
    </>
  );
}
