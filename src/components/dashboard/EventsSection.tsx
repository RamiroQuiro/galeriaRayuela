import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import {
  eventsStore,
  setEvents,
  deleteEventStore,
  type Event,
} from "../../store/eventsStore";
import {
  Calendar,
  Plus,
  Printer,
  Eye,
  Edit,
  Trash,
  Copy,
  Check,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { CreateEventForm } from "../CreateEventForm";
import { addToast } from "../../store/toastStore";

interface EventsSectionProps {
  initialEvents: Event[];
}

export function EventsSection({ initialEvents }: EventsSectionProps) {
  const events = useStore(eventsStore);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    // Solo inicializar si el store está vacío para evitar sobreescribir actualizaciones locales
    if (eventsStore.get().length === 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  const copyToClipboard = (code: string, id: number) => {
    const url = `${window.location.origin}/eventos/${code}/subir`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast("Enlace copiado al portapapeles", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const eliminarEvento = async (eventId: number, eventName: string) => {
    if (
      confirm(
        `¿Estás seguro de que quieres eliminar el evento "${eventName}" y todas sus fotos? Esta acción no se puede deshacer.`
      )
    ) {
      try {
        const res = await fetch(`/api/eventos/${eventId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          addToast("Evento eliminado correctamente", "success");
          deleteEventStore(eventId);
        } else {
          addToast(data.error || "Error al eliminar el evento", "error");
        }
      } catch (err) {
        addToast("Error al eliminar el evento", "error");
      }
    }
  };

  return (
    <section
      id="content-eventos"
      className="tab-content transition-all duration-500 animate-fadeIn"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="h-6 w-6 text-neon-purple drop-shadow-[0_0_10px_rgba(188,19,254,0.3)]" />
            Mis Eventos
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona tus galerías y códigos QR.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-neon-blue hover:bg-neon-blue/80 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-[0_0_20px_rgba(0,102,255,0.2)] active:scale-95 group"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          <span>Nuevo Evento</span>
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass-card p-12 text-center border-dashed border-2 border-white/10 group hover:border-white/20 transition-colors rounded-3xl bg-midnight-900/40">
          <div className="bg-white/5 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="h-8 w-8 text-gray-500" />
          </div>
          <p className="text-gray-400 mb-6 text-lg tracking-tight">
            No tienes eventos activos.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="glass px-8 py-3 rounded-xl text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10"
          >
            Comenzar Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: Event) => (
            <div
              key={event.id}
              className="glass-card group flex flex-col h-full overflow-hidden border border-white/5 bg-midnight-900/20 hover:border-white/20 hover:bg-midnight-900/40 transition-all duration-500 rounded-3xl"
            >
              {/* Event Header/Image */}
              <div className="h-48 bg-gray-800 relative overflow-hidden">
                {event.imagenPortada ? (
                  <img
                    src={event.imagenPortada}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900 group-hover:from-gray-700 group-hover:to-gray-800 transition-colors">
                    <Calendar className="h-12 w-12 text-gray-600 opacity-50" />
                  </div>
                )}

                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${
                      event.estado === "activo"
                        ? "bg-green-500/20 text-green-300"
                        : event.estado === "finalizado"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {event.estado}
                  </span>
                </div>
              </div>

              {/* Event details */}
              <div className="p-6 flex-1 flex flex-col">
                <h3
                  className="text-xl font-bold text-white mb-2 truncate group-hover:text-neon-blue transition-colors"
                  title={event.name}
                >
                  {event.name}
                </h3>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    Código:
                  </span>
                  <code className="px-2 py-1 rounded bg-black/40 text-neon-blue font-mono text-xs border border-neon-blue/20">
                    {event.codigoAcceso}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(event.codigoAcceso, event.id)
                    }
                    className="text-gray-500 hover:text-white transition-all p-1 hover:bg-white/5 rounded-md"
                    title="Copiar Link"
                  >
                    {copiedId === event.id ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="mt-auto border-t border-white/5 pt-4 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                  <div className="flex gap-2">
                    <a
                      href={`/events/${event.id}/poster`}
                      className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                      title="Imprimir Cartel QR"
                    >
                      <Printer className="h-4 w-4" />
                    </a>
                    <a
                      href={`/events/${event.id}`}
                      className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                      title="Ver Galería"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <a
                      href={`/eventos/${event.codigoAcceso}/subir`}
                      target="_blank"
                      className="p-2.5 hover:bg-white/5 rounded-xl text-neon-blue hover:text-neon-blue/80 transition-all border border-transparent hover:border-neon-blue/10"
                      title="Subir Fotos"
                    >
                      <Plus className="h-4 w-4" />
                    </a>
                    <a
                      href={`/events/${event.id}/edit`}
                      className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-neon-blue transition-all border border-transparent hover:border-white/10"
                      title="Editar Evento"
                    >
                      <Edit className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => eliminarEvento(event.id, event.name)}
                      className="p-2.5 hover:bg-red-500/5 rounded-xl text-red-400/70 hover:text-red-400 transition-all border border-transparent hover:border-red-500/10"
                      title="Eliminar Evento"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear Evento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Evento"
      >
        <CreateEventForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </section>
  );
}
