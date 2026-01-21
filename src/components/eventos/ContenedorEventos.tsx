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
            className="glass-button inline-flex px-8 py-4 text-base font-bold rounded-xl bg-blue-600 text-white hover:scale-105 hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
          >
            Comenzar Ahora - Crear mi Primer Evento
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {misEventos.map((event) => (
          <div
            key={event.id}
            className="glass-card group flex flex-col h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
          >
            {/* Event Header/Image */}
            <div className="h-48 bg-gray-800 relative overflow-hidden">
              {event.imagenPortada ? (
                <img
                  src={event.imagenPortada}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900 group-hover:from-gray-700 group-hover:to-gray-800 transition-colors">
                  <Calendar className="h-12 w-12 text-gray-600" />
                </div>
              )}

              <div className="absolute top-4 right-4">
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
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3
                  className="text-xl font-bold text-white truncate pr-2"
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
                  <span className="text-[10px] font-black uppercase tracking-tighter">
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
                  <span className="text-[10px] font-black uppercase tracking-tighter text-center">
                    QR FIJO <br /> {event.esPrincipal ? "ACTIVO" : "VINCULAR"}
                  </span>
                </Button>
              </div>

              <div className="mt-auto border-t border-white/10 pt-4 flex flex-col gap-3">
                {/* Primary Actions - The Flow */}
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`/dashboard/eventos/${event.codigoAcceso}/poster`}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all group/btn"
                    title="Paso 2: Imprimir QR"
                  >
                    <Printer className="h-5 w-5 text-neon-purple group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Poster
                    </span>
                  </a>

                  <a
                    href={`/eventos/${event.codigoAcceso}/subir`}
                    target="_blank"
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all group/btn"
                    title="Paso 3: Subir Fotos"
                  >
                    <Plus className="h-5 w-5 text-neon-pink group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Subir
                    </span>
                  </a>

                  <a
                    href={`/events/${event.codigoAcceso}`}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all group/btn"
                    title="Paso 4: Ver Galería"
                  >
                    <Eye className="h-5 w-5 text-neon-blue group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Ver
                    </span>
                  </a>

                  <a
                    href={`/proyector/${event.codigoAcceso}`}
                    target="_blank"
                    className="flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-100 hover:text-white transition-all group/btn border border-blue-500/30 text-center"
                    title="Proyección Combinada (Fotos + Mensajes)"
                  >
                    <Monitor className="h-5 w-5 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">
                      Proyectar
                    </span>
                  </a>

                  <a
                    href={`/proyector/${event.codigoAcceso}?display=messages`}
                    target="_blank"
                    className="flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-all group/btn border border-white/5 text-center"
                    title="Solo Muro de Mensajes"
                  >
                    <MessageSquare className="h-5 w-5 text-zinc-500 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">
                      Solo Mensajes
                    </span>
                  </a>
                </div>

                {/* Secondary Actions - Admin */}
                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                  <span className="text-[10px] text-gray-600 font-mono">
                    ID: {event.codigoAcceso}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingEvent(event)}
                      className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all flex items-center gap-1"
                      title="Editar Configuración"
                    >
                      <Edit className="h-3 w-3" />
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
                      className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-500 hover:text-yellow-400 transition-all flex items-center gap-1"
                      title="Lanzar Sorteo"
                    >
                      <Trophy className="h-3 w-3" />
                      <span className="text-[10px]">Sorteo</span>
                    </button>
                    <button
                      onClick={() => handleEliminar(event.id, event.name)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-400 transition-all flex items-center gap-1"
                      title="Mover a Papelera"
                    >
                      <Trash className="h-3 w-3" />
                      <span className="text-[10px]">Borrar</span>
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
