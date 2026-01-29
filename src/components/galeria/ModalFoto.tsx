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
  const [mostrarEsperaImpresion, setMostrarEsperaImpresion] = useState(false);
  const [tiempoEspera, setTiempoEspera] = useState(15);
  const [editorCerrado, setEditorCerrado] = useState(false);
  const contadorRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const cerrarCartel = () => {
    setMostrarEsperaImpresion(false);
    setImprimiendo(false);
    setEditorCerrado(false);
    if (contadorRef.current) {
      clearInterval(contadorRef.current);
      contadorRef.current = null;
    }
    setFotoSeleccionada(null);
  };

  const imprimirFoto = () => {
    if (imprimiendo) return;

    setImprimiendo(true);
    setMostrarEsperaImpresion(true);
    setTiempoEspera(15);
    setEditorCerrado(true);

    // Iniciar contador del cartel
    if (contadorRef.current) clearInterval(contadorRef.current);
    const contador = setInterval(() => {
      setTiempoEspera((prev: number) => {
        if (prev <= 1) {
          clearInterval(contador);
          contadorRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    contadorRef.current = contador;

    // Crear iframe oculto para imprimir sin abrir nueva pestaña
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.write(`
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
            window.onload = function() {
              setTimeout(() => { 
                window.print(); 
                // Eliminar iframe después de imprimir
                setTimeout(() => {
                  document.body.removeChild(parent.document.querySelector('iframe'));
                }, 1000);
              }, 800); 
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();

  };
  return (
    <>
      {!editorCerrado && (
        <div className="z-100 fixed inset-0 flex justify-center items-center bg-black/90 backdrop-blur-md p-4 md:p-8 animate-fadeIn">
          <div className="relative flex md:flex-row flex-col bg-zinc-950 shadow-2xl border border-white/10 rounded-[2.5rem] w-full max-w-5xl h-full max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Botón Cerrar Flotante */}
        <button
          onClick={cerrarEditor}
          className="top-6 right-6 z-110 absolute bg-white/5 hover:bg-white/10 backdrop-blur-xl p-3 border border-white/10 rounded-full text-white active:scale-90 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Área de Edición (Izquierda) */}
        <div className="relative flex flex-[1.5] justify-center items-center bg-black p-4 md:p-12 overflow-hidden">
          <div className="relative flex flex-col bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 pb-20 md:pb-28 w-full max-w-[450px] aspect-4/5 transition-all duration-500">
            {modoRecorte ? (
              <div className="relative flex-1 bg-zinc-100 w-full overflow-hidden">
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
              <div className="group relative bg-zinc-50 w-full h-full overflow-hidden">
                <img
                  src={fotoSeleccionada.path}
                  className="w-full h-full object-cover transition-all duration-300"
                  style={estilosFiltro}
                  alt="Preview"
                />
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none"></div>
              </div>
            )}

            <p className="right-0 bottom-6 md:bottom-10 left-0 absolute mt-6 md:mt-8 font-serif font-bold text-zinc-800 text-3xl md:text-5xl text-center italic tracking-tight">
              {fotoSeleccionada.nombreInvitado || "Recuerdo"}
            </p>
          </div>
        </div>

        {/* Panel Lateral derecho */}
        <div className="flex flex-col gap-8 bg-zinc-900/50 backdrop-blur-3xl p-8 border-white/5 border-l w-full md:w-96 overflow-y-auto">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-blue-500" />
            <h3 className="font-black text-white text-sm uppercase tracking-[0.2em]">
              Laboratorio
            </h3>
          </div>

          {/* Botón Activar Recorte */}
          <div className="space-y-4">
            {!modoRecorte ? (
              <button
                onClick={() => setModoRecorte(true)}
                className="group flex justify-center items-center gap-3 bg-white/5 hover:bg-blue-500/10 px-6 py-4 border border-white/10 hover:border-blue-500/50 rounded-2xl w-full font-black text-[11px] text-zinc-300 hover:text-white uppercase tracking-widest transition-all"
              >
                <Crop className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                Ajustar Encuadre
              </button>
            ) : (
              <div className="gap-4 grid grid-cols-2">
                <button
                  onClick={confirmarRecorte}
                  className="flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-6 py-4 rounded-2xl w-full font-black text-[11px] text-black uppercase tracking-widest transition-all"
                >
                  <Check className="w-4 h-4" />
                  Listo
                </button>
                <button
                  onClick={() => setModoRecorte(false)}
                  className="flex justify-center items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-4 border border-white/5 rounded-2xl w-full font-black text-[11px] text-zinc-300 uppercase tracking-widest transition-all"
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
              <div className="gap-6 grid grid-cols-1">
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

              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center bg-white/5 p-4 border border-white/5 rounded-2xl">
                  <span className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">
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

          <div className="mt-auto pt-8 border-white/5 border-t">
            <button
              onClick={imprimirFoto}
              disabled={modoRecorte}
              className={`w-full py-6 bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-4 ${
                modoRecorte
                  ? "opacity-50 cursor-not-allowed grayscale"
                  : ""
              }`}
            >
              <Printer className="w-5 h-5" />
              Imprimir Polaroid
            </button>
          </div>
        </div>
          </div>
        </div>
      )}
      
      {/* Modal de espera después de cerrar */}
      {mostrarEsperaImpresion && (
        <div
          className="z-[200] fixed inset-0 flex justify-center items-center bg-black/95 backdrop-blur-md p-4 animate-fadeIn"
          onClick={cerrarCartel}
        >
          <div
            className="bg-white p-8 rounded-3xl w-full max-w-md text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className="flex justify-center items-center bg-blue-500 mx-auto mb-4 rounded-full w-16 h-16 animate-pulse">
                <Printer className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-2 font-bold text-gray-800 text-2xl">Preparando impresión</h3>
              <p className="text-gray-600">Por favor espera unos segundos...</p>
            </div>
            
            {/* Contador dedicado */}
            <div className="mb-4">
              <div className="mb-2 font-bold text-blue-500 text-4xl">{tiempoEspera}</div>
              <div className="text-gray-500 text-sm">segundos restantes</div>
            </div>
            
            <div className="bg-gray-200 mb-4 rounded-full w-full h-2">
              <div 
                className="bg-blue-500 rounded-full h-2 transition-all duration-1000" 
                style={{width: `${(tiempoEspera / 15) * 100}%`}}
              ></div>
            </div>
            <p className="text-gray-500 text-sm">Toca fuera para cerrar</p>
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
      <label className="font-black text-[10px] text-white/40 tracking-[0.2em]">
        {label}
      </label>
      <span className="font-mono font-black text-[10px] text-neon-blue">
        {valor}%
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={valor}
      onChange={(e) => setValor(Number(e.target.value))}
      className="bg-white/5 rounded-full w-full h-1 transition-all accent-neon-blue hover:accent-white appearance-none cursor-pointer"
    />
  </div>
);
