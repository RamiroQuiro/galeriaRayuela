import React, { useState } from "react";
import { Printer } from "lucide-react";
import { CartelCentroMesa } from "./PosterCenterpiece";
import { PosterStandard } from "./PosterStandard";

interface PosterGeneratorProps {
  event: {
    name: string;
    imagenPortada: string | null;
    codigoAcceso: string;
  };
  galleryQrUri: string;
  uploadQrUri: string;
}

type LayoutType = "dual" | "gallery" | "upload" | "centerpiece";

export const PosterGenerator: React.FC<PosterGeneratorProps> = ({
  event,
  galleryQrUri,
  uploadQrUri,
}) => {
  const [layout, setLayout] = useState<LayoutType>("dual");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Controls Section - Hidden when printing */}
      <div className="no-print bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Personalizar Cartel
          </h2>
          <p className="text-gray-400 text-sm">
            Selecciona qué códigos QR quieres mostrar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setLayout("dual")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                layout === "dual"
                  ? "bg-neon-blue text-white shadow-lg shadow-neon-blue/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              DOBLE
            </button>
            <button
              onClick={() => setLayout("gallery")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                layout === "gallery"
                  ? "bg-neon-blue text-white shadow-lg shadow-neon-blue/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              GALERÍA
            </button>
            <button
              onClick={() => setLayout("upload")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                layout === "upload"
                  ? "bg-neon-blue text-white shadow-lg shadow-neon-blue/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              SUBIR
            </button>
            <button
              onClick={() => setLayout("centerpiece")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase ${
                layout === "centerpiece"
                  ? "bg-neon-blue text-white shadow-lg shadow-neon-blue/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Centro Mesa
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 ml-2 bg-white text-slate-900 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Poster Preview Area */}
      <div className="print-container flex justify-center p-4 md:p-12 bg-gray-100/5 rounded-3xl min-h-[80vh] overflow-auto">
        <div
          id="poster-area"
          className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col items-center text-center p-[15mm] font-display text-slate-900 overflow-hidden shrink-0 transition-all duration-300"
        >
          {/* Header Strip */}
          <div className="absolute top-0 inset-x-0 h-4 bg-linear-to-r from-neon-blue via-neon-purple to-neon-pink" />

          {layout === "centerpiece" ? (
            <CartelCentroMesa event={event} uploadQrUri={uploadQrUri} />
          ) : (
            <PosterStandard
              variant={layout}
              event={event}
              galleryQrUri={galleryQrUri}
              uploadQrUri={uploadQrUri}
            />
          )}
        </div>
      </div>
    </div>
  );
};
