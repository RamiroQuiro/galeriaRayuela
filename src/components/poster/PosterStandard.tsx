import React from "react";
import { Share2, Eye } from "lucide-react";

type StandardVariant = "dual" | "gallery" | "upload";

interface PosterStandardProps {
  variant: StandardVariant;
  event: {
    name: string;
  };
  galleryQrUri: string;
  uploadQrUri: string;
}

export const PosterStandard: React.FC<PosterStandardProps> = ({
  variant,
  event,
  galleryQrUri,
  uploadQrUri,
}) => {
  return (
    <>
      {/* Header Content based on Layout */}
      <div className="mt-8 mb-12 w-full animate-fadeIn">
        {variant === "dual" && (
          <div className="poster-header-text">
            <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase mb-4">
              ¡MIRA Y COMPARTE!
            </h2>
            <div className="inline-block px-8 py-3 bg-slate-900 rounded-full">
              <p className="text-3xl font-bold text-white uppercase italic tracking-widest">
                {event.name}
              </p>
            </div>
          </div>
        )}

        {variant === "gallery" && (
          <div className="poster-header-gallery">
            <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase mb-4">
              ¡MIRA LAS FOTOS!
            </h2>
            <p className="text-2xl text-slate-500 font-medium mb-6">
              Escanea para entrar a la galería de
            </p>
            <div className="inline-block px-8 py-4 bg-neon-blue rounded-full">
              <p className="text-4xl font-bold text-white uppercase italic tracking-widest">
                {event.name}
              </p>
            </div>
          </div>
        )}

        {variant === "upload" && (
          <div className="poster-header-upload">
            <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase mb-4">
              ¡SUBE TUS FOTOS!
            </h2>
            <p className="text-2xl text-slate-500 font-medium mb-6">
              Comparte tus mejores momentos en
            </p>
            <div className="inline-block px-8 py-4 bg-neon-purple rounded-full">
              <p className="text-4xl font-bold text-white uppercase italic tracking-widest">
                {event.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* QR Container */}
      <div className="flex gap-10 w-full justify-center mb-12 animate-fadeIn">
        {/* Gallery QR */}
        {(variant === "dual" || variant === "gallery") && (
          <div className="w-fit flex flex-col items-center gap-4">
            <div
              className={`relative p-6 bg-slate-50 rounded-4xl border-4 border-slate-100 shadow-sm ${
                variant === "gallery" ? "scale-125 mx-12 my-6" : ""
              }`}
            >
              <img
                src={galleryQrUri}
                alt="QR Galería"
                className={`${
                  variant === "gallery"
                    ? "w-[85mm] h-[85mm]"
                    : "w-[75mm] h-[75mm]"
                } object-contain`}
              />
            </div>
            {variant === "dual" && (
              <div>
                <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Ver Galería
                </p>
                <p className="text-sm text-slate-500 font-bold">
                  Escanea para mirar las fotos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upload QR */}
        {(variant === "dual" || variant === "upload") && (
          <div className="w-fit flex flex-col items-center gap-4">
            <div
              className={`relative p-6 bg-slate-50 rounded-4xl border-4 border-slate-100 shadow-sm ${
                variant === "upload" ? "scale-125 mx-12 my-6" : ""
              }`}
            >
              <img
                src={uploadQrUri}
                alt="QR Subida"
                className={`${
                  variant === "upload"
                    ? "w-[85mm] h-[85mm]"
                    : "w-[75mm] h-[75mm]"
                } object-contain`}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-2xl shadow-lg border-2 border-slate-100">
                <Share2 className="h-8 w-8 text-neon-purple" />
              </div>
            </div>
            {variant === "dual" && (
              <div>
                <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Subir Fotos
                </p>
                <p className="text-sm text-slate-500 font-bold">
                  Comparte tus momentos
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mb-12 max-w-md bg-slate-50 p-6 rounded-3xl border border-slate-100 mx-auto">
        <p className="text-slate-600 font-medium leading-relaxed">
          ¡Usa la cámara de tu celular para escanear el código QR! No necesitas
          descargar ninguna app.
        </p>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />
    </>
  );
};
