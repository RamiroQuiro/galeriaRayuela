import { useState } from "react";
import { Trash2, RotateCcw, XCircle } from "lucide-react";
import type { Event } from "../../store/eventsStore";
import { showToast } from "../toast/showToast";

interface PapeleraProps {
  deletedEvents: Event[];
}

export function Papelera({ deletedEvents = [] }: PapeleraProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>(deletedEvents);

  if (!events || events.length === 0) return null;

  const handleRestaurar = async (id: number) => {
    try {
      const formData = new FormData();
      formData.append("estado", "activo");

      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        showToast("Evento restaurado");
        setEvents((prev) => prev.filter((e) => e.id !== id));
        // Opcional: Recargar página para ver el evento en la lista principal
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast("Error al restaurar", "error");
      }
    } catch (e) {
      showToast("Error de conexión", "error");
    }
  };

  const handleEliminarDefinitivo = async (id: number) => {
    if (
      !confirm(
        "¿Estás SEGURO? Esto eliminará el evento y TODAS sus fotos para siempre."
      )
    )
      return;

    try {
      const res = await fetch(`/api/events/${id}?hard=true`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Evento eliminado definitivamente");
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        showToast("Error al eliminar", "error");
      }
    } catch (e) {
      showToast("Error de conexión", "error");
    }
  };

  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      <div
        className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-300 transition-colors mb-4 w-fit"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-sm font-bold uppercase tracking-widest">
          Papelera ({events.length})
        </span>
        <div
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
          {events.map((event) => (
            <div
              key={event.id}
              className="glass-card p-4 border-red-500/20 bg-red-500/5 group relative opacity-75 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white truncate max-w-[150px]">
                    {event.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Eliminado el:{" "}
                    {new Date(event.deleted_at || "").toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleRestaurar(event.id)}
                    className="p-2 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded-lg transition-colors"
                    title="Restaurar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEliminarDefinitivo(event.id)}
                    className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Eliminar Definitivamente"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
