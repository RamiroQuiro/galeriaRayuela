import { useState } from "react";
import { addToast } from "../../store/toastStore";
import { addService, updateService } from "../../store/servicesStore";
import {
  Image as ImageIcon,
  Plus,
  X,
  Save,
  DollarSign,
  Tag,
  FileText,
} from "lucide-react";
import { showToast } from "../toast/showToast";

interface ServiceData {
  id?: number;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category?: string;
  images?: string[];
  [key: string]: any;
}

interface CreateServiceFormProps {
  onSuccess?: () => void;
  initialData?: ServiceData | null;
}

export function CreateServiceForm({
  onSuccess,
  initialData,
}: CreateServiceFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [unit, setUnit] = useState(initialData?.unit || "evento");
  const [category, setCategory] = useState(
    initialData?.category || "fotografia"
  );
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images[0]
      : ""
  );

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
    if (!name || !price || !unit) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("unit", unit);
    formData.append("category", category);
    if (file) {
      formData.append("image", file);
    }

    try {
      // Logic only for Creating for now, Edit needs PUT endpoint implementation
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/services/${initialData.id}` : "/api/services";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        showToast(
          isEdit ? "Servicio actualizado" : "Servicio creado exitosamente"
        );

        if (isEdit) {
          // Ideally update store via updateService(json.data.service) if API returned it
          // For now, keep reload as API for PUT isn't updated to return object yet (checked only POST)
          window.location.reload();
        } else {
          if (json.data?.service) {
            addService(json.data.service);
          }
        }

        if (onSuccess) onSuccess();
        if (!isEdit) {
          // Reset form
          setName("");
          setDescription("");
          setPrice("");
          setFile(null);
          setPreview("");
        }
      } else {
        showToast(json.error || "Error al guardar servicio", {
          background: "bg-red-500",
        });
      }
    } catch (error) {
      showToast("Error de conexión", { background: "bg-red-500" });
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!initialData?.id;

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Nombre del Servicio
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input w-full text-sm outline-hidden py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus:border-neon-blue/50 transition-all"
            placeholder="Ej: Cobertura Fotográfica Completa"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="glass-input w-full text-sm outline-hidden py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus:border-neon-blue/50 transition-all resize-none"
            placeholder="Detalla qué incluye tu servicio..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Precio
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="glass-input w-full text-sm outline-hidden py-3 pl-10 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus:border-neon-blue/50 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Unidad
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="glass-input w-full text-sm outline-hidden py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:border-neon-blue/50 transition-all [&>option]:bg-slate-900"
            >
              <option value="evento">Por Evento</option>
              <option value="hora">Por Hora</option>
              <option value="persona">Por Persona</option>
              <option value="foto">Por Foto</option>
              <option value="producto">Por Producto</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full text-sm outline-hidden py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:border-neon-blue/50 transition-all [&>option]:bg-slate-900"
          >
            <option value="fotografia">Fotografía</option>
            <option value="video">Video</option>
            <option value="dj">DJ / Música</option>
            <option value="catering">Catering / Barras</option>
            <option value="salon">Salón / Espacio</option>
            <option value="ambientacion">Ambientación</option>
            <option value="entretenimiento">Entretenimiento</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Imagen del Servicio
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
                  {isEdit ? "Cambiar Imagen" : "Subir Imagen"}
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
          disabled={loading || !name || !price}
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
              <span>{isEdit ? "Guardar Servicio" : "Crear Servicio"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
