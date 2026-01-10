import { useState, useEffect } from "react";
import { addToast } from "../store/toastStore";
import { addEvent, updateEvent, eventsStore } from "../store/eventsStore";
import { Image as ImageIcon, Plus, X, Save } from "lucide-react";
import { showToast } from "./toast/showToast";

interface EventData {
  id?: number;
  name: string;
  imagenPortada?: string | null;
  [key: string]: any;
}

interface CreateEventFormProps {
  onSuccess?: () => void;
  initialData?: EventData | null;
}

export function CreateEventForm({
  onSuccess,
  initialData,
}: CreateEventFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(
    initialData?.imagenPortada || ""
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPreview(initialData.imagenPortada || "");
    } else {
      setName("");
      setPreview("");
      setFile(null);
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    if (file) {
      formData.append("coverImage", file);
    }

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/events/${initialData.id}` : "/api/events";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        showToast(isEdit ? "Evento actualizado" : "Evento creado exitosamente");

        if (isEdit) {
          // For simple updates we might need to refresh or update store manually if API returns data
          // updateEvent(json.data.evento) // Assuming store has updateEvent
          window.location.reload(); // Simple reload to reflect changes for now or implement updateEvent in store
        } else {
          if (json.data.evento) {
            addEvent(json.data.evento);
          }
        }

        if (onSuccess) onSuccess();
        if (!isEdit) {
          setName("");
          setFile(null);
          setPreview("");
        }
      } else {
        if (json.requiereUpgrade) {
          addToast(
            `${json.message}. Mejora tu plan para crear más eventos.`,
            "error"
          );
        } else {
          addToast(
            json.message || `Error al ${isEdit ? "editar" : "crear"} evento`,
            "error"
          );
        }
      }
    } catch (error) {
      addToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!initialData?.id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Nombre del Evento
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input w-full text-sm outline-hidden py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus:border-neon-blue/50 transition-all"
            placeholder="Ej: Boda Ana & Víctor"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Imagen de Portada (Opcional)
          </label>

          {preview ? (
            <div className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-video">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview("");
                  }}
                  className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md transition-all scale-75 group-hover:scale-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed border-white/10 rounded-2xl hover:border-neon-blue/40 hover:bg-white/5 transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="bg-white/5 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-gray-500 group-hover:text-neon-blue" />
                </div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  {isEdit ? "Cambiar Portada" : "Seleccionar Portada"}
                </p>
                <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-tight font-medium">
                  PNG, JPG (Máx. 5MB)
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !name}
          className="w-full py-4 rounded-xl bg-linear-to-r from-neon-blue to-neon-purple text-white font-black uppercase tracking-widest text-[11px] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(0,102,255,0.25)] flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>{isEdit ? "Guardando..." : "Creando..."}</span>
            </div>
          ) : (
            <>
              {isEdit ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEdit ? "Guardar Cambios" : "Crear Evento"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
