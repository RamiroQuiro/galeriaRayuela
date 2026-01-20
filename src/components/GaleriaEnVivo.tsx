import { Maximize2, Image as ImageIcon, MonitorPlay } from "lucide-react";
import type { Image } from "../db/schemas";
import { useEffect, useState } from "react";
import ModalFoto from "./galeria/ModalFoto";
import Button from "./ui/Button";

interface Props {
  eventoId: number;
  imagenesIniciales: Image[];
}

export function GaleriaEnVivo({ eventoId, imagenesIniciales }: Props) {
  const [imagenes, setImagenes] = useState<Image[]>(imagenesIniciales);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<Image | null>(null);

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
      <div className="flex justify-between items-center mb-8"></div>

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
              className="w-full h-full object-cover grayscale-30 group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100"
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
                  <div className="w-5 h-5 rounded-full bg-linear-to-br from-neon-blue to-neon-purple p-px">
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
        <ModalFoto
          fotoSeleccionada={fotoSeleccionada}
          setFotoSeleccionada={setFotoSeleccionada}
        />
      )}
    </>
  );
}
