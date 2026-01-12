import React from "react";

interface CartelCentroMesaProps {
  event: {
    name: string;
    imagenPortada?: string | null;
    fecha?: string;
    lugar?: string;
  };
  uploadQrUri: string;
  tamaño?: "grande" | "mediano" | "pequeño";
  estilo?: "moderno" | "elegante" | "minimalista";
}

export const CartelCentroMesa: React.FC<CartelCentroMesaProps> = ({
  event,
  uploadQrUri,
  tamaño = "mediano",
  estilo = "elegante",
}) => {
  // Configuraciones por tamaño
  const config = {
    grande: {
      qrSize: "w-[110mm] h-[110mm]",
      containerPadding: "p-12",
      titleSize: "text-7xl",
      subtitleSize: "text-2xl",
      spacing: "space-y-10",
    },
    mediano: {
      qrSize: "w-[90mm] h-[90mm]",
      containerPadding: "p-10",
      titleSize: "text-5xl",
      subtitleSize: "text-xl",
      spacing: "space-y-8",
    },
    pequeño: {
      qrSize: "w-[70mm] h-[70mm]",
      containerPadding: "p-8",
      titleSize: "text-4xl",
      subtitleSize: "text-lg",
      spacing: "space-y-6",
    },
  };

  const { qrSize, containerPadding, titleSize, subtitleSize, spacing } =
    config[tamaño];

  // Estilos según tipo
  const estilosContenedor = {
    moderno: "bg-white rounded-2xl shadow-lg",
    elegante:
      "bg-gradient-to-b from-white to-gray-50 rounded-xl border border-gray-200",
    minimalista: "bg-transparent",
  };

  const estilosTitulo = {
    moderno: "font-bold text-gray-900",
    elegante: "font-serif font-medium text-gray-800 tracking-wide",
    minimalista: "font-light text-gray-700",
  };

  const estilosQR = {
    moderno: "border-2 border-gray-300 rounded-lg p-3",
    elegante: "border border-gray-200 rounded-lg p-4 bg-white",
    minimalista: "",
  };

  return (
    <div
      className={`${estilosContenedor[estilo]} ${containerPadding} max-w-4xl mx-auto`}
    >
      <div className={`flex flex-col items-center justify-center ${spacing}`}>
        {/* Título del Evento - Sutil */}
        <div className="text-center">
          <h1
            className={`${titleSize} ${estilosTitulo[estilo]} leading-tight mb-3`}
          >
            {event.name}
          </h1>

          {/* Detalles opcionales */}
          {(event.fecha || event.lugar) && (
            <div className="flex justify-center gap-6 text-gray-500 text-sm font-light mt-3">
              {event.fecha && (
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{event.fecha}</span>
                </div>
              )}
              {event.lugar && (
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{event.lugar}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Línea divisoria sutil */}
        <div className="w-24 h-px bg-gray-300"></div>

        {/* QR Code - Limpio y claro */}
        <div className="relative">
          {/* Contenedor del QR con bordes sutiles */}
          <div className={`${estilosQR[estilo]} ${qrSize}`}>
            <img
              src={uploadQrUri}
              alt="QR para compartir fotos"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Indicador de QR (muy sutil) */}
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-500 font-medium">
                ESCANEAR
              </span>
            </div>
          </div>
        </div>

        {/* Imagen del evento (opcional) */}
        {event.imagenPortada && (
          <div className="w-48 h-32 overflow-hidden rounded-lg">
            <img
              src={event.imagenPortada}
              alt={event.name}
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        )}

        {/* Instrucciones - Muy sutiles */}
        <div className="text-center max-w-md">
          <p className={`${subtitleSize} text-gray-600 font-light mb-4`}>
            Comparte tus fotos del evento
          </p>

          {/* Pasos simples */}
          <div className="flex justify-center items-center gap-8 text-gray-500">
            <div className="text-center">
              <div className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-1 text-sm">
                1
              </div>
              <div className="text-xs">Escanear</div>
            </div>

            <div className="text-gray-300">→</div>

            <div className="text-center">
              <div className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-1 text-sm">
                2
              </div>
              <div className="text-xs">Subir foto</div>
            </div>

            <div className="text-gray-300">→</div>

            <div className="text-center">
              <div className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-1 text-sm">
                3
              </div>
              <div className="text-xs">Ver en pantalla</div>
            </div>
          </div>

          {/* Mensaje final sutil */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-400">
              Las fotos se mostrarán en la pantalla principal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Versión EXTRA minimalista para impresión
export const CartelMinimalistaQR: React.FC<CartelCentroMesaProps> = ({
  event,
  uploadQrUri,
}) => {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex flex-col items-center space-y-8">
        {/* Título muy sutil */}
        <div className="text-center">
          <h2 className="text-4xl font-light text-gray-800 mb-2">
            {event.name}
          </h2>
          {event.fecha && (
            <p className="text-sm text-gray-500">{event.fecha}</p>
          )}
        </div>

        {/* QR limpio */}
        <div className="p-2 border border-gray-200 rounded">
          <img src={uploadQrUri} alt="QR" className="w-[80mm] h-[80mm]" />
        </div>

        {/* Indicador mínimo */}
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm">Escanea para compartir fotos</span>
        </div>

        {/* Pasos mínimos */}
        <div className="flex gap-6 text-gray-600 text-sm">
          <span>1. Escanear</span>
          <span>•</span>
          <span>2. Subir</span>
          <span>•</span>
          <span>3. Compartir</span>
        </div>
      </div>
    </div>
  );
};

// Versión horizontal para centro de mesa alargado
export const CartelHorizontalCentroMesa: React.FC<CartelCentroMesaProps> = ({
  event,
  uploadQrUri,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        {/* Lado izquierdo: Info del evento */}
        <div className="flex-1 pr-8">
          <h1 className="text-4xl font-light text-gray-800 mb-4">
            {event.name}
          </h1>

          {event.fecha && (
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{event.fecha}</span>
            </div>
          )}

          <p className="text-gray-500 text-lg mb-6">
            Comparte tus fotos escaneando el código
          </p>

          {/* Mini pasos */}
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="border border-gray-300 rounded-full px-3 py-1">
              1. Escanear
            </div>
            <div className="border border-gray-300 rounded-full px-3 py-1">
              2. Subir
            </div>
            <div className="border border-gray-300 rounded-full px-3 py-1">
              3. Compartir
            </div>
          </div>
        </div>

        {/* Lado derecho: QR */}
        <div className="flex-shrink-0">
          <div className="border border-gray-300 rounded-lg p-3">
            <img src={uploadQrUri} alt="QR" className="w-[70mm] h-[70mm]" />
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              Escanea para compartir
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
