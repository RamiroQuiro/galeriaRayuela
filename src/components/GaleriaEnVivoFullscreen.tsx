import { Maximize2, Eye, Image as ImageIcon } from "lucide-react";
import type { Image } from "../db/schemas";
import { useEffect, useState } from "react";
import ModalFoto from "./galeria/ModalFoto";
import Button from "./ui/Button";

interface Props {
  eventoId: number;
  imagenesIniciales: Image[];
  nombreEvento?: string;
}

export function GaleriaEnVivoFullscreen({ eventoId, imagenesIniciales, nombreEvento }: Props) {
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

  const abrirFullscreen = () => {
    const url = `/events/${eventoId}/fullscreen`;
    window.open(
      url,
      'fullscreen',
      'width=' + screen.width + ',height=' + screen.height + ',top=0,left=0,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no'
    );
  };

  if (imagenes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center col-span-full bg-white/5 py-32 border-2 border-white/10 border-dashed rounded-3xl text-gray-400">
        <ImageIcon className="opacity-20 mb-4 w-12 h-12" />
        <p className="font-bold text-white/50 text-xl uppercase tracking-[0.2em]">
          Esperando fotos...
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          ¡Sé el primero en compartir un momento!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Botón de Fullscreen */}
      <div className="mb-4 flex justify-end">
        <Button
          onClick={abrirFullscreen}
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver en Fullscreen
        </Button>
      </div>

      {/* Grid de Galería Minimalista - EXACTAMENTE IGUAL que la original */}
      <div className="gap-5 md:gap-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {imagenes.map((img) => (
          <div
            key={img.id}
            className="group relative bg-white/5 shadow-xl border border-white/5 hover:border-neon-blue/20 rounded-lg aspect-square overflow-hidden hover:scale-[1.03] transition-all duration-500 cursor-pointer"
            onClick={() => abrirEditor(img)}
          >
            <img
              src={img.path}
              alt="Foto del evento"
              className="opacity-80 group-hover:opacity-100 grayscale-30 group-hover:grayscale-0 w-full h-full object-cover transition-all duration-700"
              loading="lazy"
            />

            {/* Hover Overlay */}
            <div className="bottom-0 left-1/2 absolute flex justify-center items-center bg-black/ opacity-100 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity -translate-x-1/2 duration-500 transform">
              <div className="bg-gray-700 p-4 border border-white/20 rounded-lg duration-500 transform">
                <p className="text-white text-xs">Imprimir</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {fotoSeleccionada && (
        <ModalFoto
          nombreEvento={nombreEvento}
          fotoSeleccionada={fotoSeleccionada}
          setFotoSeleccionada={setFotoSeleccionada}
        />
      )}
    </>
  );
}
