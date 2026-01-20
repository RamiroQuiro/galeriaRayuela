import React from "react";
import { Share2, Eye, MessageSquare } from "lucide-react";

type StandardVariant = "dual" | "gallery" | "upload" | "whatsapp";

interface PosterStandardProps {
  variant: StandardVariant;
  event: {
    name: string;
  };
  galleryQrUri: string;
  uploadQrUri: string;
  whatsappQrUri?: string;
}

export const PosterStandard: React.FC<PosterStandardProps> = ({
  variant,
  event,
  galleryQrUri,
  uploadQrUri,
  whatsappQrUri,
}) => {
  return (
    <div className="w-full">
      {/* Header Content based on Layout */}
      <div className="mt-12 mb-16 w-full animate-fadeIn flex flex-col items-center text-center">
        {variant === "dual" && (
          <div className="poster-header-text">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase mb-4">
              ¡MIRA Y COMPARTE!
            </h2>
            <p className="text-4xl font-bold text-slate-600 uppercase tracking-tight">
              {event.name}
            </p>
          </div>
        )}

        {variant === "gallery" && (
          <div className="poster-header-gallery">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase mb-4">
              ¡MIRA LAS FOTOS!
            </h2>
            <p className="text-2xl text-slate-500 font-medium mb-4">
              Escanea para entrar a la galería de
            </p>
            <p className="text-5xl font-black text-slate-900 uppercase tracking-tight">
              {event.name}
            </p>
          </div>
        )}

        {variant === "upload" && (
          <div className="poster-header-upload">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase mb-4">
              ¡SUBE TUS FOTOS!
            </h2>
            <p className="text-2xl text-slate-500 font-medium mb-4">
              Comparte tus mejores momentos en
            </p>
            <p className="text-5xl font-black text-slate-900 uppercase tracking-tight">
              {event.name}
            </p>
          </div>
        )}

        {variant === "whatsapp" && (
          <div className="poster-header-whatsapp">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase mb-4">
              ¡MANDA POR WHATSAPP!
            </h2>
            <p className="text-2xl text-slate-500 font-medium mb-4">
              Envía tus fotos directamente al evento
            </p>
            <p className="text-5xl font-black text-green-600 uppercase tracking-tight">
              {event.name}
            </p>
          </div>
        )}
      </div>

      {/* QR Container */}
      <div className="flex gap-10 w-full justify-center mb-12 animate-fadeIn">
        {/* Gallery QR */}
        {(variant === "dual" || variant === "gallery") && (
          <div className="w-fit flex flex-col items-center gap-4">
            <div
              className={`relative border-2 rounded-lg border-border ${
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
                } object-contain rounded-lg`}
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
          <div className="w-fit flex flex-col items-center gap-4 ">
            <div
              className={`relative border-2 rounded-lg border-border ${
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
                } object-contain rounded-lg`}
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

        {/* WhatsApp QR */}
        {variant === "whatsapp" && whatsappQrUri && (
          <div className="w-fit flex flex-col items-center gap-4">
            <div className="relative border-2 rounded-lg border-border scale-125 mx-12 my-6">
              <img
                src={whatsappQrUri}
                alt="QR WhatsApp"
                className="w-[85mm] h-[85mm] object-contain rounded-lg"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-2xl shadow-lg border-2 border-slate-100">
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Mandar por WhatsApp
              </p>
              <p className="text-sm text-slate-500 font-bold">
                Envía tus fotos al instante
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions: Step by Step */}
      <div className="mt-12 mb-8 max-w-sm mx-auto w-full">
        <div className=" flex-col gap-10 bg-blue-50 flex items-start justify-center text-blue-600 font-black text-xl border border-blue-100/30 shadow-sm rounded-lg p-6 w-full">
          <div className="flex items-center gap-6">
            <div className=" ">1</div>
            <div className="text-left">
              <p className="text-slate-800 font-bold text-sm uppercase tracking-tighter">
                Escanea
              </p>
              <p className="text-slate-500 text-xs leading-tight">
                Apunta con tu cámara al código QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="">2</div>
            <div className="text-left">
              <p className="text-slate-800 font-bold text-sm uppercase tracking-tighter">
                {variant === "gallery"
                  ? "Entra"
                  : variant === "whatsapp"
                    ? "Envía"
                    : "Sube"}
              </p>
              <p className="text-slate-500 text-xs leading-tight">
                {variant === "gallery"
                  ? "Accede a la galería privada"
                  : variant === "whatsapp"
                    ? "Manda tus fotos por mensaje"
                    : "Selecciona tus fotos favoritas"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="">3</div>
            <div className="text-left">
              <p className="text-slate-800 font-bold text-sm uppercase tracking-tighter">
                Disfruta
              </p>
              <p className="text-slate-500 text-xs leading-tight">
                ¡Mira las fotos de todos en vivo!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
