import React, { useRef, useState } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";
import type { Image } from "../../db/schemas";
import { Crop, SlidersHorizontal, X, Printer, Check } from "lucide-react";

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

export default function ModalFoto({
  fotoSeleccionada,
  setFotoSeleccionada,
}: {
  fotoSeleccionada: Image;
  setFotoSeleccionada: React.Dispatch<React.SetStateAction<Image | null>>;
}) {
  const [modoPolaroid, setModoPolaroid] = useState(true);
  const [modoRecorte, setModoRecorte] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);

  // Print Timer State
  const [imprimiendo, setImprimiendo] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);

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
      const croppedDataUrl = cropper.getCroppedCanvas().toDataURL();
      setFotoSeleccionada({
        ...fotoSeleccionada,
        path: croppedDataUrl,
      });
      setModoRecorte(false);
    }
  };

  const imprimirFoto = () => {
    if (imprimiendo) return;

    setImprimiendo(true);
    setTiempoRestante(20); // 20 seconds cooldown

    const timer = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setImprimiendo(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4 md:p-10">
      <div className="bg-gray-900 w-full max-w-5xl h-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden text-gray-200 rounded-3xl border border-white/10 shadow-2xl relative">
        {/* Botón Cerrar Flotante (para móvil) */}
        <button
          onClick={cerrarEditor}
          className="absolute cursor-pointer top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white md:hidden backdrop-blur-md border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Área de Edición (Izquierda) */}
        <div className="flex-1 relative bg-black/50 flex items-center justify-center p-8 overflow-auto">
          <div className="relative transition-all duration-300 shadow-2xl bg-white p-4 pb-24 max-w-[85%] max-h-[85%] overflow-visible flex flex-col">
            {modoRecorte ? (
              <Cropper
                ref={cropperRef}
                src={fotoSeleccionada.path}
                style={{ height: "70vh", width: "100%" }}
                // Cropper.js options
                aspectRatio={1}
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
                className="w-full h-auto shadow-inner aspect-square object-cover"
                style={estilosFiltro}
                alt="Preview"
              />
            )}

            <p className="text-center font-cursive text-gray-800 mt-6 text-3xl font-normal absolute bottom-8 left-0 right-0">
              {fotoSeleccionada.nombreInvitado || "Recuerdo"}
            </p>
          </div>
        </div>

        {/* Panel Lateral derecho */}
        <div className="w-full md:w-80 bg-black/20 backdrop-blur-2xl border-l border-white/5 p-6 flex flex-col gap-6 overflow-y-auto z-10">
          <div className="flex justify-between items-center pb-6 border-b border-white/5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-neon-blue" />
              <h3 className="font-black text-white text-xs tracking-[0.2em] uppercase">
                Edición
              </h3>
            </div>
            <button
              onClick={cerrarEditor}
              className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all hidden md:block"
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
                setValor={(v) => setFiltros((f: any) => ({ ...f, brillo: v }))}
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
                setValor={(v) => setFiltros((f: any) => ({ ...f, sepia: v }))}
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
            <button
              onClick={imprimirFoto}
              disabled={modoRecorte || imprimiendo}
              className={`w-full py-5 bg-linear-to-r from-neon-blue to-neon-purple text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,102,255,0.25)] flex items-center justify-center gap-3 ${
                modoRecorte || imprimiendo
                  ? "opacity-50 cursor-not-allowed grayscale"
                  : ""
              }`}
            >
              <Printer
                className={`w-5 h-5 ${imprimiendo ? "animate-pulse" : ""}`}
              />
              {imprimiendo ? `Imprimiendo (${tiempoRestante}s)` : "Imprimir"}
            </button>
            {imprimiendo && (
              <p className="text-[10px] text-center text-neon-blue font-bold animate-pulse">
                ¡Tu foto se está procesando!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
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
