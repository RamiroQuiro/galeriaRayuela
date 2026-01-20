import { useState, useEffect, useRef } from "react";

// Types
interface Image {
  id: number | string;
  path: string;
  nombreInvitado?: string | null;
  createdAt?: string | Date;
  formato?: string;
}

interface ProyeccionProps {
  eventId: number | string;
  initialImages?: Image[];
}

export default function ProyeccionGaleria({
  eventId,
  initialImages = [],
}: ProyeccionProps) {
  const [imagenes, setImagenes] = useState<Image[]>(initialImages);
  const [indiceActual, setIndiceActual] = useState(0);
  const [cargando, setCargando] = useState(initialImages.length === 0);
  const [entrando, setEntrando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estilos CSS en línea para evitar conflictos
  const estilosGlobal = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden !important;
      position: fixed;
      top: 0;
      left: 0;
      background-color: #000;
    }
    
    #proyeccion-root {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 9999 !important;
      overflow: hidden !important;
    }
    
    /* Ocultar scrollbars */
    ::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    
    /* Ocultar elementos de navegación */
    header, nav, footer, .navbar, .header, .controls, button, a {
      display: none !important;
    }
  `;

  // Inicializar pantalla completa y ocultar elementos
  useEffect(() => {
    // Agregar estilos globales
    const styleSheet = document.createElement("style");
    styleSheet.textContent = estilosGlobal;
    document.head.appendChild(styleSheet);

    // Ocultar cursor después de 2 segundos
    let timeoutCursor: NodeJS.Timeout;
    const ocultarCursor = () => {
      document.body.style.cursor = "none";
    };

    const resetCursor = () => {
      document.body.style.cursor = "auto";
      clearTimeout(timeoutCursor);
      timeoutCursor = setTimeout(ocultarCursor, 2000);
    };

    // Forzar fullscreen
    const entrarFullscreen = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen({
            navigationUI: "hide",
          });
        }
      } catch (err) {
        console.log("Fallback a pantalla completa manual");
      }

      // Ocultar elementos del navegador
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      // Bloquear zoom en móviles
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        );
      }

      // Event listeners
      window.addEventListener("mousemove", resetCursor);
      window.addEventListener("touchstart", resetCursor);

      ocultarCursor();

      return () => {
        window.removeEventListener("mousemove", resetCursor);
        window.removeEventListener("touchstart", resetCursor);
        clearTimeout(timeoutCursor);
      };
    };

    entrarFullscreen();

    // Bloquear teclas
    const bloquearTeclas = (e: KeyboardEvent) => {
      if (
        e.key === "F11" ||
        e.key === "F5" ||
        (e.ctrlKey && (e.key === "r" || e.key === "R")) ||
        e.key === "Escape"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("keydown", bloquearTeclas, true);
    document.addEventListener("keyup", bloquearTeclas, true);
    document.addEventListener("keypress", bloquearTeclas, true);

    return () => {
      document.removeEventListener("keydown", bloquearTeclas, true);
      document.removeEventListener("keyup", bloquearTeclas, true);
      document.removeEventListener("keypress", bloquearTeclas, true);
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Cargar imágenes iniciales
  useEffect(() => {
    const cargarImagenes = async () => {
      try {
        // CORREGIDO: Usar la ruta de API correcta (inglés)
        const response = await fetch(
          `/api/events/${eventId}/images?timestamp=${Date.now()}`
        );
        if (!response.ok) throw new Error("Error fetching images");
        const data = await response.json();

        // Mapear datos si es necesario o usarlos directo
        setImagenes(data);
        setCargando(false);
      } catch (error) {
        console.error("Error cargando imágenes:", error);
        setCargando(false);
      }
    };

    // Si no tenemos imágenes iniciales, cargar
    if (imagenes.length === 0) {
      cargarImagenes();
    }

    // Polling cada 10 segundos
    const intervalo = setInterval(cargarImagenes, 10000);
    return () => clearInterval(intervalo);
  }, [eventId, imagenes.length]);

  // Transiciones automáticas
  useEffect(() => {
    if (imagenes.length <= 1) return;

    const transicionar = async () => {
      setSaliendo(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIndiceActual((prev) => (prev + 1) % imagenes.length);
      setEntrando(true);

      await new Promise((resolve) => setTimeout(resolve, 100));
      setSaliendo(false);

      await new Promise((resolve) => setTimeout(resolve, 900));
      setEntrando(false);
    };

    const intervalo = setInterval(transicionar, 8000); // Cambio cada 8 segundos

    return () => clearInterval(intervalo);
  }, [imagenes.length]);

  // Render loading
  if (cargando && imagenes.length === 0) {
    return (
      <div
        ref={containerRef}
        id="proyeccion-root"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "24px",
            opacity: 0.7,
            animation: "pulse 2s infinite",
          }}
        >
          Cargando galería...
        </div>

        <style>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
      </div>
    );
  }

  // Render sin imágenes
  if (imagenes.length === 0) {
    return (
      <div
        ref={containerRef}
        id="proyeccion-root"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "32px",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📷</div>
          Esperando fotos...
        </div>
      </div>
    );
  }

  const imagenActual = imagenes[indiceActual];
  const siguienteIndice = (indiceActual + 1) % imagenes.length;
  const imagenSiguiente = imagenes[siguienteIndice];

  // Helper para preload
  const preloadImage = (url: string) => {
    // Basic preload
    return url;
  };

  return (
    <div
      ref={containerRef}
      id="proyeccion-root"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {/* Imagen de fondo difuminada */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          left: "-20px",
          right: "-20px",
          bottom: "-20px",
          backgroundImage: `url(${imagenActual.path})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(40px) brightness(0.4)",
          opacity: saliendo ? 0.7 : 1,
          transition: "opacity 2s ease-in-out",
          zIndex: 1,
        }}
      />

      {/* Preload siguiente imagen */}
      <div style={{ display: "none" }}>
        <img src={imagenSiguiente?.path} alt="preload" />
      </div>

      {/* Imagen actual con transición */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: saliendo ? 0 : 1,
          transform: saliendo ? "scale(1.05)" : "scale(1)",
          transition: "all 2s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: 0,
        }}
      >
        <img
          src={imagenActual.path}
          alt="Proyección"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: "4px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            animation: entrando ? "entradaSuave 1s ease-out" : "none",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Efecto de difuminado entre transiciones */}
      {saliendo && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "black",
            opacity: 0,
            animation: "aparecerDesaparecer 2s ease-in-out",
            zIndex: 3,
          }}
        />
      )}

      <style>{`
        @keyframes entradaSuave {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes aparecerDesaparecer {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes mostrarNombre {
          0%,
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          10%,
          90% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
