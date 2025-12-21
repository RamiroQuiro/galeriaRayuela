import { useState } from "react";
import { addToast } from "../store/toastStore";

interface Props {
  codigoEvento: string;
  nombreEvento: string;
}

export function FormularioSubidaPublica({ codigoEvento, nombreEvento }: Props) {
  const [nombreInvitado, setNombreInvitado] = useState("");
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  // Manejar selección de archivos y generar previsualizaciones
  const manejarCambioArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivosSeleccionados = e.target.files;
    setArchivos(archivosSeleccionados);

    if (archivosSeleccionados && archivosSeleccionados.length > 0) {
      const urls: string[] = [];
      for (let i = 0; i < Math.min(archivosSeleccionados.length, 2); i++) {
        urls.push(URL.createObjectURL(archivosSeleccionados[i]));
      }
      setPrevisualizaciones(urls);
    } else {
      setPrevisualizaciones([]);
    }
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!archivos || archivos.length < 1 || archivos.length > 2) {
      addToast("Debes seleccionar entre 1 y 2 fotos", "error");
      return;
    }

    // Validar tamaño de archivos (5MB máximo)
    const MAX_TAMANIO = 5 * 1024 * 1024; // 5MB en bytes
    for (let i = 0; i < archivos.length; i++) {
      if (archivos[i].size > MAX_TAMANIO) {
        addToast(
          `La imagen "${archivos[i].name}" excede el tamaño máximo de 5MB`,
          "error"
        );
        return;
      }
    }

    setCargando(true);

    const formData = new FormData();
    formData.append("nombreInvitado", nombreInvitado);
    for (let i = 0; i < archivos.length; i++) {
      formData.append("imagenes", archivos[i]);
    }

    try {
      const respuesta = await fetch(
        `/api/eventos/${codigoEvento}/subir-fotos`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (respuesta.ok) {
        addToast("¡Fotos subidas exitosamente! 🎉", "success");
        setExitoso(true);

        // Limpiar formulario
        setNombreInvitado("");
        setArchivos(null);
        setPrevisualizaciones([]);

        // Resetear el input de archivos
        const inputArchivos = document.getElementById(
          "imagenes"
        ) as HTMLInputElement;
        if (inputArchivos) inputArchivos.value = "";
      } else {
        const datos = await respuesta.json();
        addToast(datos.message || "Error al subir las fotos", "error");
      }
    } catch (error) {
      addToast("Error de conexión. Intenta nuevamente.", "error");
    } finally {
      setCargando(false);
    }
  };

  if (exitoso) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Fotos subidas!
        </h3>
        <p className="text-gray-600 mb-6">
          Tus fotos ya están en la galería de {nombreEvento}
        </p>
        <button
          onClick={() => setExitoso(false)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Subir más fotos
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-6">
      {/* Campo de nombre (opcional) */}
      <div>
        <label
          htmlFor="nombreInvitado"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Tu nombre (opcional)
        </label>
        <input
          id="nombreInvitado"
          type="text"
          value={nombreInvitado}
          onChange={(e) => setNombreInvitado(e.target.value)}
          placeholder="Ej: María González"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Selector de archivos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecciona tus fotos (1 o 2) <span className="text-red-500">*</span>
        </label>

        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50">
          <div className="space-y-1 text-center w-full">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600 justify-center">
              <label
                htmlFor="imagenes"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2"
              >
                <span>Selecciona archivos</span>
                <input
                  id="imagenes"
                  name="imagenes"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={manejarCambioArchivos}
                  className="sr-only"
                  required
                />
              </label>
              <p className="pl-1">o arrastra y suelta</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF hasta 5MB cada una
            </p>
            {archivos && archivos.length > 0 && (
              <p className="text-sm font-medium text-blue-600 mt-2">
                {archivos.length} archivo(s) seleccionado(s)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Previsualizaciones */}
      {previsualizaciones.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {previsualizaciones.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {cargando ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Subiendo...
          </span>
        ) : (
          "📸 Subir Fotos"
        )}
      </button>
    </form>
  );
}
