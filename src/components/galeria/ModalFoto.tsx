import React, { useRef, useState } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
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
    setTiempoRestante(20);

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
          <title>Imprimir Polaroid - Galería Rayuela</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: white;
            }
            .polaroid-print {
              background: white;
              padding: 1.5rem 1.5rem 5rem 1.5rem;
              box-shadow: 0 0 0 1px #eee;
              width: 100%;
              max-width: 450px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            img {
              width: 100%;
              aspect-ratio: 1/1;
              object-fit: cover;
              filter: ${estilosFiltro.filter};
            }
            .caption {
              margin-top: 1.5rem;
              font-family: 'Caveat', cursive;
              color: #333;
              font-size: 2.5rem;
              text-align: center;
            }
            @media print {
              body { background: white; }
              .polaroid-print { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="polaroid-print">
            <img src="${fotoSeleccionada?.path}" />
            <div class="caption">
              ${fotoSeleccionada?.nombreInvitado || "Recuerdo"}
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 800); 
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn p-4 md:p-8">
      <div className="bg-zinc-950 w-full max-w-5xl h-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden text-zinc-100 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
        {/* Botón Cerrar Flotante */}
        <button
          onClick={cerrarEditor}
          className="absolute cursor-pointer top-6 right-6 z-110 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-xl border border-white/10 transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Área de Edición (Izquierda) */}
        <div className="flex-[1.5] relative bg-black flex items-center justify-center p-4 md:p-12 overflow-hidden">
          <div className="relative transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white p-4 pb-20 md:pb-28 w-full max-w-[450px] aspect-4/5 flex flex-col">
            {modoRecorte ? (
              <div className="w-full flex-1 overflow-hidden bg-zinc-100 relative">
                <Cropper
                  ref={cropperRef}
                  src={fotoSeleccionada.path}
                  style={{ height: "100%", width: "100%" }}
                  aspectRatio={1}
                  guides={true}
                  viewMode={1}
                  dragMode="move"
                  background={false}
                  responsive={true}
                  autoCropArea={1}
                  checkOrientation={false}
                  zoomOnWheel={true}
                  toggleDragModeOnDblclick={false}
                />
              </div>
            ) : (
              <div className="w-full h-full overflow-hidden bg-zinc-50 relative group">
                <img
                  src={fotoSeleccionada.path}
                  className="w-full h-full object-cover transition-all duration-300"
                  style={estilosFiltro}
                  alt="Preview"
                />
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none"></div>
              </div>
            )}

            <p className="text-center font-serif italic text-zinc-800 mt-6 md:mt-8 text-3xl md:text-5xl font-bold absolute bottom-6 md:bottom-10 left-0 right-0 tracking-tight">
              {fotoSeleccionada.nombreInvitado || "Recuerdo"}
            </p>
          </div>
        </div>

        {/* Panel Lateral derecho */}
        <div className="w-full md:w-96 bg-zinc-900/50 backdrop-blur-3xl border-l border-white/5 p-8 flex flex-col gap-8 overflow-y-auto">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-blue-500" />
            <h3 className="font-black text-white text-sm tracking-[0.2em] uppercase">
              Laboratorio
            </h3>
          </div>

          {/* Botón Activar Recorte */}
          <div className="space-y-4">
            {!modoRecorte ? (
              <button
                onClick={() => setModoRecorte(true)}
                className="w-full py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/10 bg-white/5 text-zinc-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white flex items-center justify-center gap-3 group"
              >
                <Crop className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                Ajustar Encuadre
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={confirmarRecorte}
                  className="w-full py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500 text-black hover:bg-emerald-400 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Listo
                </button>
                <button
                  onClick={() => setModoRecorte(false)}
                  className="w-full py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center justify-center gap-2 border border-white/5"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Filtros */}
          {!modoRecorte && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 gap-6">
                <ControlSlider
                  label="BRILLO"
                  valor={filtros.brillo}
                  setValor={(v) =>
                    setFiltros((f: any) => ({ ...f, brillo: v }))
                  }
                  min={50}
                  max={150}
                />
                <ControlSlider
                  label="CONTRASTE"
                  valor={filtros.contraste}
                  setValor={(v) =>
                    setFiltros((f: any) => ({ ...f, contraste: v }))
                  }
                  min={50}
                  max={150}
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
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Blanco y Negro
                  </span>
                  <button
                    onClick={() =>
                      setFiltros((f: any) => ({ ...f, byn: !f.byn }))
                    }
                    className={`w-12 h-6 rounded-full transition-all duration-500 ${
                      filtros.byn ? "bg-blue-600" : "bg-zinc-700"
                    } relative`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all duration-300 ${
                        filtros.byn ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto pt-8 border-t border-white/5">
            <button
              onClick={imprimirFoto}
              disabled={modoRecorte || imprimiendo}
              className={`w-full py-6 bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-4 ${
                modoRecorte || imprimiendo
                  ? "opacity-50 cursor-not-allowed grayscale"
                  : ""
              }`}
            >
              <Printer
                className={`w-5 h-5 ${imprimiendo ? "animate-spin" : ""}`}
              />
              {imprimiendo
                ? `Esperando (${tiempoRestante}s)`
                : "Imprimir Polaroid"}
            </button>
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
