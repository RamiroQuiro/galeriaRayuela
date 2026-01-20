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
import { Calendar, Plus, Printer, Eye, Edit, Trash } from "lucide-react";
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
              <h3
                className="text-xl font-bold text-white mb-2 truncate"
                title={event.name}
              >
                {event.name}
              </h3>

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
