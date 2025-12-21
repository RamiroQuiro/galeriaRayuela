import { useEffect, useState, useRef } from "react";
import type { Image } from "../db/schemas";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

interface Props {
  eventoId: number;
  imagenesIniciales: Image[];
}

interface Filtros {
  brillo: number;
  contraste: number;
  saturacion: number;
  sepia: number;
  byn: boolean;
  blur: number;
}

const FILTROS_INICIALES: Filtros = {
  brillo: 100,
  contraste: 100,
  saturacion: 100,
  sepia: 0,
  byn: false,
  blur: 0,
};

export function GaleriaEnVivo({ eventoId, imagenesIniciales }: Props) {
  const [imagenes, setImagenes] = useState<Image[]>(imagenesIniciales);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<Image | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [modoPolaroid, setModoPolaroid] = useState(false);
  const [modoRecorte, setModoRecorte] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/eventos/${eventoId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.imagenes) {
          setImagenes(data.imagenes);
        }
      } catch (error) {
        console.error("Error al parsear datos del stream:", error);
      }
    };

    return () => eventSource.close();
  }, [eventoId]);

  const abrirEditor = (img: Image) => {
    setFotoSeleccionada(img);
    setFiltros(FILTROS_INICIALES);
    setModoPolaroid(false);
    setModoRecorte(false);
  };

  const cerrarEditor = () => {
    setFotoSeleccionada(null);
  };

  const estilosFiltro = {
    filter: `
      brightness(${filtros.brillo}%) 
      contrast(${filtros.contraste}%) 
      saturate(${filtros.saturacion}%) 
      sepia(${filtros.sepia}%) 
      grayscale(${filtros.byn ? 100 : 0}%)
      blur(${filtros.blur}px)
    `,
  };

  const confirmarRecorte = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper && fotoSeleccionada) {
      // Obtener la imagen recortada como DataURL
      const croppedDataUrl = cropper.getCroppedCanvas().toDataURL();
      // Actualizar la foto seleccionada temporalmente con la versión recortada
      // Nota: Esto solo afecta la visualización en el editor, no guarda en BD por ahora
      setFotoSeleccionada({
        ...fotoSeleccionada,
        path: croppedDataUrl,
      });
      setModoRecorte(false);
    }
  };

  const imprimirFoto = () => {
    const ventanaImpresion = window.open("", "_blank");
    if (!ventanaImpresion) return;

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Imprimir Foto - Galería Rayuela</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: #f3f4f6;
            }
            .polaroid-print {
              background: white;
              padding: 1rem 1rem 4rem 1rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              max-width: 80%;
            }
            img {
              width: 100%;
              height: auto;
              filter: ${estilosFiltro.filter};
            }
          </style>
        </head>
        <body>
          <div class="${modoPolaroid ? "polaroid-print" : ""}">
            <img src="${fotoSeleccionada?.path}" />
            ${
              modoPolaroid
                ? `
            <div style="text-align: center; margin-top: 1rem; font-family: cursive; color: #374151; font-size: 1.5rem;">
              ${fotoSeleccionada?.nombreInvitado || "Recuerdo Inolvidable"}
            </div>
            `
                : ""
            }
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500); 
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  if (imagenes.length === 0) {
    return (
      <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white/5 rounded-xl border border-dashed border-gray-700">
        <p className="text-lg text-gray-500">Esperando fotos...</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de Galería Minimalista */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {imagenes.map((img, index) => (
          <div
            key={img.id}
            className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => abrirEditor(img)}
          >
            <img
              src={img.path}
              alt="Foto del evento"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
              loading="lazy"
            />
            {img.nombreInvitado && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate text-center">
                  {img.nombreInvitado}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {fotoSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn">
          <div className="bg-gray-900 w-full h-full flex flex-col md:flex-row overflow-hidden text-gray-200">
            {/* Área de Edición (Izquierda) */}
            <div className="flex-1 relative bg-black/50 flex items-center justify-center p-8 overflow-auto">
              <div
                className={`relative transition-all duration-300 shadow-2xl ${
                  modoPolaroid
                    ? "bg-white p-4 pb-20 max-w-[80%] max-h-[80%] overflow-visible"
                    : "max-w-full max-h-full"
                }`}
              >
                {modoRecorte ? (
                  <Cropper
                    ref={cropperRef}
                    src={fotoSeleccionada.path}
                    style={{ height: "70vh", width: "100%" }}
                    // Cropper.js options
                    initialAspectRatio={NaN}
                    guides={true}
                    viewMode={1}
                    dragMode="move"
                    background={false}
                    className="max-h-[80vh]"
                    responsive={true}
                    autoCropArea={1}
                    checkOrientation={false}
                  />
                ) : (
                  <img
                    src={fotoSeleccionada.path}
                    className={`${
                      modoPolaroid
                        ? "w-full h-auto shadow-inner"
                        : "max-w-full max-h-[85vh] object-contain shadow-2xl"
                    }`}
                    style={estilosFiltro}
                    alt="Preview"
                  />
                )}

                {modoPolaroid && (
                  <p className="text-center font-cursive text-gray-800 mt-6 text-3xl font-normal absolute bottom-6 left-0 right-0">
                    {fotoSeleccionada.nombreInvitado || "Recuerdo"}
                  </p>
                )}
              </div>
            </div>

            {/* Panel Lateral derecho */}
            <div className="w-full md:w-80 bg-gray-800 border-l border-gray-700 p-6 flex flex-col gap-6 overflow-y-auto z-10">
              <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                <h3 className="font-bold text-white tracking-wide">EDICIÓN</h3>
                <button
                  onClick={cerrarEditor}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Botón Activar Recorte */}
              <div>
                {!modoRecorte ? (
                  <button
                    onClick={() => setModoRecorte(true)}
                    className="w-full py-2 px-3 rounded text-sm font-bold uppercase tracking-wider transition-colors border bg-transparent border-gray-600 text-gray-300 hover:border-white hover:text-white"
                  >
                    ✂️ Activar Recorte
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={confirmarRecorte}
                      className="w-full py-2 px-3 rounded text-sm font-bold uppercase tracking-wider transition-colors bg-green-600 text-white hover:bg-green-700"
                    >
                      ✅ Aplicar
                    </button>
                    <button
                      onClick={() => setModoRecorte(false)}
                      className="w-full py-2 px-3 rounded text-sm font-bold uppercase tracking-wider transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                )}
                {modoRecorte && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Mueve y ajusta el recuadro para seleccionar el área.
                  </p>
                )}
              </div>

              {/* Filtros - Solo visibles si NO estamos recortando */}
              {!modoRecorte && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Ajustes de Color
                    </span>
                  </div>

                  <ControlSlider
                    label="BRILLO"
                    valor={filtros.brillo}
                    setValor={(v) => setFiltros((f) => ({ ...f, brillo: v }))}
                    min={0}
                    max={200}
                  />
                  <ControlSlider
                    label="CONTRASTE"
                    valor={filtros.contraste}
                    setValor={(v) =>
                      setFiltros((f) => ({ ...f, contraste: v }))
                    }
                    min={0}
                    max={200}
                  />
                  <ControlSlider
                    label="SATURACIÓN"
                    valor={filtros.saturacion}
                    setValor={(v) =>
                      setFiltros((f) => ({ ...f, saturacion: v }))
                    }
                    min={0}
                    max={200}
                  />
                  <ControlSlider
                    label="SEPIA"
                    valor={filtros.sepia}
                    setValor={(v) => setFiltros((f) => ({ ...f, sepia: v }))}
                    min={0}
                    max={100}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-gray-400">
                      BLANCO Y NEGRO
                    </span>
                    <button
                      onClick={() => setFiltros((f) => ({ ...f, byn: !f.byn }))}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        filtros.byn ? "bg-blue-500" : "bg-gray-600"
                      } relative`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${
                          filtros.byn ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-3 pt-6 border-t border-gray-700">
                {!modoRecorte && (
                  <button
                    onClick={() => setModoPolaroid(!modoPolaroid)}
                    className={`w-full py-3 rounded-lg border-2 font-bold transition-all ${
                      modoPolaroid
                        ? "border-blue-500 text-blue-400 bg-blue-500/10"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {modoPolaroid ? "🎞️ MODO POLAROID ON" : "🎞️ MODO POLAROID"}
                  </button>
                )}

                <button
                  onClick={imprimirFoto}
                  disabled={modoRecorte}
                  className={`w-full py-4 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 ${
                    modoRecorte ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  IMPRIMIR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ControlSlider = ({
  label,
  valor,
  setValor,
  min,
  max,
}: {
  label: string;
  valor: number;
  setValor: (v: number) => void;
  min: number;
  max: number;
}) => (
  <div>
    <div className="flex justify-between mb-2">
      <label className="text-xs font-bold text-gray-400 tracking-wider">
        {label}
      </label>
      <span className="text-xs text-gray-500 font-mono">{valor}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={valor}
      onChange={(e) => setValor(Number(e.target.value))}
      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
    />
  </div>
);
