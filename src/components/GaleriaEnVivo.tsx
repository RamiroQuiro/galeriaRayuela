import {
  X,
  Camera,
  Printer,
  Crop,
  SlidersHorizontal,
  Check,
  Trash2,
  Maximize2,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import type { Image } from "../db/schemas";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useEffect, useRef, useState } from "react";

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
      <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
        <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-xl font-bold text-white/50 uppercase tracking-[0.2em]">
          Esperando fotos...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          ¡Sé el primero en compartir un momento!
        </p>
      </div>
    );
  }
  return (
    <>
      {/* Grid de Galería Minimalista */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {imagenes.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square bg-white/5 rounded-3xl overflow-hidden cursor-pointer border border-white/5 shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:border-white/20 hover:shadow-neon-blue/20"
            onClick={() => abrirEditor(img)}
          >
            <img
              src={img.path}
              alt="Foto del evento"
              className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100"
              loading="lazy"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <Maximize2 className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
            </div>

            {img.nombreInvitado && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-linear-to-br from-neon-blue to-neon-purple p-[1px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <ImageIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <p className="text-white text-[10px] font-black uppercase tracking-widest truncate">
                    {img.nombreInvitado}
                  </p>
                </div>
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
            <div className="w-full md:w-80 bg-midnight-950/50 backdrop-blur-2xl border-l border-white/10 p-8 flex flex-col gap-8 overflow-y-auto z-10">
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-neon-blue" />
                  <h3 className="font-black text-white text-xs tracking-[0.2em] uppercase">
                    Edición
                  </h3>
                </div>
                <button
                  onClick={cerrarEditor}
                  className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Botón Activar Recorte */}
              <div>
                {!modoRecorte ? (
                  <button
                    onClick={() => setModoRecorte(true)}
                    className="w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 bg-white/5 text-gray-300 hover:border-white/40 hover:text-white flex items-center justify-center gap-2"
                  >
                    <Crop className="w-4 h-4" />
                    Recortar
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={confirmarRecorte}
                      className="w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-neon-green text-black hover:brightness-110 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Aplicar
                    </button>
                    <button
                      onClick={() => setModoRecorte(false)}
                      className="w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-white/5 text-gray-300 hover:bg-white/10 flex items-center justify-center gap-2 border border-white/10"
                    >
                      <X className="w-4 h-4" />
                      Mala mía
                    </button>
                  </div>
                )}
                {modoRecorte && (
                  <p className="text-[10px] text-gray-500 mt-3 text-center uppercase font-bold tracking-widest">
                    Ajusta el área de recorte
                  </p>
                )}
              </div>

              {/* Filtros - Solo visibles si NO estamos recortando */}
              {!modoRecorte && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Ajustes de Color
                    </span>
                  </div>

                  <ControlSlider
                    label="BRILLO"
                    valor={filtros.brillo}
                    setValor={(v) =>
                      setFiltros((f: any) => ({ ...f, brillo: v }))
                    }
                    min={0}
                    max={200}
                  />
                  <ControlSlider
                    label="CONTRASTE"
                    valor={filtros.contraste}
                    setValor={(v) =>
                      setFiltros((f: any) => ({ ...f, contraste: v }))
                    }
                    min={0}
                    max={200}
                  />
                  <ControlSlider
                    label="SATURACIÓN"
                    valor={filtros.saturacion}
                    setValor={(v) =>
                      setFiltros((f: any) => ({ ...f, saturacion: v }))
                    }
                    min={0}
                    max={200}
                  />
                  <ControlSlider
                    label="SEPIA"
                    valor={filtros.sepia}
                    setValor={(v) =>
                      setFiltros((f: any) => ({ ...f, sepia: v }))
                    }
                    min={0}
                    max={100}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      BLANCO Y NEGRO
                    </span>
                    <button
                      onClick={() =>
                        setFiltros((f: any) => ({ ...f, byn: !f.byn }))
                      }
                      className={`w-12 h-6 rounded-full transition-all duration-300 ${
                        filtros.byn
                          ? "bg-neon-blue shadow-[0_0_15px_rgba(0,102,255,0.4)]"
                          : "bg-white/10"
                      } relative border border-white/5`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-xl ${
                          filtros.byn ? "translate-x-6 bg-white" : "bg-gray-500"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
                {!modoRecorte && (
                  <button
                    onClick={() => setModoPolaroid(!modoPolaroid)}
                    className={`w-full py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                      modoPolaroid
                        ? "border-neon-purple text-neon-purple bg-neon-purple/10 shadow-[0_0_20px_rgba(188,19,254,0.15)]"
                        : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                    {modoPolaroid ? "Polaroid On" : "Polaroid"}
                  </button>
                )}

                <button
                  onClick={imprimirFoto}
                  disabled={modoRecorte}
                  className={`w-full py-5 bg-linear-to-r from-neon-blue to-neon-purple text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,102,255,0.25)] flex items-center justify-center gap-3 ${
                    modoRecorte ? "opacity-50 cursor-not-allowed grayscale" : ""
                  }`}
                >
                  <Printer className="w-5 h-5" />
                  Imprimir
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
    <div className="flex justify-between mb-3">
      <label className="text-[10px] font-black text-white/40 tracking-[0.2em]">
        {label}
      </label>
      <span className="text-[10px] text-neon-blue font-black font-mono">
        {valor}%
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={valor}
      onChange={(e) => setValor(Number(e.target.value))}
      className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-neon-blue hover:accent-white transition-all"
    />
  </div>
);
