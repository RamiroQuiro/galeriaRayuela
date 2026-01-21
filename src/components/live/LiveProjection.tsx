import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Camera } from "lucide-react";

interface LiveImage {
  id: number;
  path: string;
  nombreInvitado: string | null;
}

interface LiveMessage {
  id: number;
  text: string;
  senderNumber: string | null;
}

interface LiveWinner {
  id: number;
  winnerNumber: string;
  prize: string | null;
  createdAt: string;
}

interface Props {
  event: {
    id: number;
    name: string;
    codigoAcceso: string;
  };
}

export const LiveProjection: React.FC<Props> = ({ event }) => {
  const [images, setImages] = useState<LiveImage[]>([]);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [winner, setWinner] = useState<LiveWinner | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  // Trackers separados para tiempo real garantizado
  const [lastImageId, setLastImageId] = useState(0);
  const [lastMessageId, setLastMessageId] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"gallery" | "messages">("gallery");
  const [displayConfig, setDisplayConfig] = useState<
    "combined" | "only-messages"
  >("combined");

  // Detectar configuración desde la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("display") === "messages") {
      setDisplayConfig("only-messages");
      setMode("messages");
    }
  }, []);

  const fetchLiveData = useCallback(async () => {
    try {
      const url = `/api/eventos/live/${event.id}?afterImage=${lastImageId}&afterMessage=${lastMessageId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        const {
          images: newImages,
          messages: newMessages,
          winner: latestWinner,
        } = data.data;

        // Manejo de Ganador
        if (latestWinner && (!winner || latestWinner.id !== winner.id)) {
          setWinner(latestWinner);
          setShowWinner(true);
          setTimeout(() => setShowWinner(false), 15000);
        }

        // Actualización de Imágenes
        if (newImages.length > 0) {
          setImages((prev) => {
            const ids = new Set(prev.map((i) => i.id));
            const unique = newImages.filter((i: any) => !ids.has(i.id));
            return [...unique, ...prev].slice(0, 50);
          });
          const maxImgId = Math.max(...newImages.map((i: any) => i.id));
          setLastImageId((prev) => Math.max(prev, maxImgId));
        }

        // Actualización de Mensajes
        if (newMessages.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const unique = newMessages.filter((m: any) => !ids.has(m.id));
            return [...unique, ...prev].slice(0, 50);
          });
          const maxMsgId = Math.max(...newMessages.map((m: any) => m.id));
          setLastMessageId((prev) => Math.max(prev, maxMsgId));
        }
      }
    } catch (error) {
      console.error("Error fetching live data:", error);
    }
  }, [event.id, lastImageId, lastMessageId, winner]);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 4000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Rotación de contenido (Respetando el modo)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);

      if (displayConfig === "only-messages") {
        setMode("messages");
        return;
      }

      // Alternar modo combinado (con mayor peso a fotos si hay pocas o viceversa)
      if (messages.length > 0 && images.length > 0) {
        setMode((prev) =>
          Math.random() > 0.6
            ? prev === "gallery"
              ? "messages"
              : "gallery"
            : prev,
        );
      } else if (messages.length > 0) {
        setMode("messages");
      } else {
        setMode("gallery");
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [messages.length, images.length, displayConfig]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Sistema de Partículas / Confeti (Solo cuando hay ganador) */}
      <AnimatePresence>
        {showWinner && (
          <div className="absolute inset-0 pointer-events-none z-40">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  top: "100%",
                  left: `${Math.random() * 100}%`,
                  opacity: 1,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  top: "-10%",
                  left: `${(Math.random() - 0.5) * 20 + 50}%`,
                  rotate: 360,
                  opacity: 0,
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: Math.random() * 2,
                }}
                className="absolute w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: ["#eab308", "#3b82f6", "#ef4444", "#22c55e"][
                    Math.floor(Math.random() * 4)
                  ],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showWinner && winner ? (
          <motion.div
            key={`winner-${winner.id}`}
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="z-50 flex flex-col items-center bg-zinc-900/90 backdrop-blur-2xl p-16 rounded-[4rem] border-8 border-yellow-500 shadow-[0_0_100px_rgba(234,179,8,0.3)] text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-9xl mb-10"
            >
              🏆
            </motion.div>
            <h2 className="text-4xl text-yellow-500 font-black uppercase tracking-widest mb-4">
              ¡Tenemos un Ganador!
            </h2>
            <p className="text-8xl font-black text-white mb-8 tracking-tighter">
              {winner.winnerNumber.slice(0, -4)}****
            </p>
            <div className="bg-yellow-500 text-black px-10 py-4 rounded-2xl text-3xl font-bold uppercase italic">
              {winner.prize || "Premio Especial"}
            </div>

            <p className="mt-12 text-zinc-500 font-bold uppercase tracking-widest">
              Presentante con tu celular para canjear
            </p>
          </motion.div>
        ) : mode === "gallery" && images.length > 0 ? (
          <motion.div
            key={`img-${images[currentIndex % images.length]?.id}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.5 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <img
              src={images[currentIndex % images.length]?.path}
              alt="Live"
              className="max-w-[85%] max-h-[85%] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] border-8 border-white/10"
            />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex items-center gap-3">
              <Camera className="w-5 h-5 text-zinc-400" />
              <span className="text-white text-xl font-bold tracking-tight">
                @
                {images[currentIndex % images.length]?.nombreInvitado ||
                  "Invitado"}
              </span>
            </div>
          </motion.div>
        ) : mode === "messages" && messages.length > 0 ? (
          <motion.div
            key={`msg-${messages[currentIndex % messages.length]?.id}`}
            className="relative w-full h-full flex items-center justify-center p-8"
          >
            {/* Contenedor del "Sobre" */}
            <div className="relative w-full max-w-4xl h-[600px] flex items-center justify-center">
              {/* Parte trasera del sobre (visible al fondo) */}
              <div className="absolute inset-0 bg-zinc-800/80 rounded-3xl border-4 border-zinc-700/50 transform rotate-1 shadow-2xl skew-x-1" />

              {/* La Carta / El Papel */}
              <motion.div
                initial={{ y: 400, opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                exit={{ y: -600, opacity: 0, transition: { duration: 0.8 } }}
                transition={{
                  type: "spring",
                  damping: 12,
                  stiffness: 100,
                  delay: 0.5,
                }}
                className="relative z-20 w-4/5 h-4/5 bg-[#fcfcfc] p-12 md:p-20 rounded-lg shadow-2xl border-l-12 border-blue-500/20"
                style={{
                  backgroundImage:
                    "linear-gradient(#e5e5e5 1px, transparent 1px)",
                  backgroundSize: "100% 40px",
                }}
              >
                <div className="flex flex-col h-full">
                  <MessageSquare className="w-12 h-12 text-blue-500/30 mb-8" />

                  <blockquote className="flex-1 flex items-center justify-center">
                    <p className="text-4xl md:text-6xl font-serif italic text-zinc-800 tracking-tight leading-snug text-center">
                      "{messages[currentIndex % messages.length]?.text}"
                    </p>
                  </blockquote>

                  <div className="mt-8 flex justify-end items-center gap-3">
                    <div className="h-px w-12 bg-zinc-300" />
                    <span className="text-zinc-400 font-mono text-xl uppercase tracking-widest italic">
                      De un invitado especial
                    </span>
                  </div>
                </div>

                {/* Sello de cera o detalle final */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-red-600/10 rounded-full border-4 border-red-600/20 flex items-center justify-center rotate-12 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-600/30 flex items-center justify-center text-red-600/40 font-black text-2xl">
                    R
                  </div>
                </div>
              </motion.div>

              {/* Parte delantera del sobre (corte inferior) */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-zinc-900 z-10 rounded-b-3xl border-t-4 border-zinc-800/50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-2 bg-zinc-700 rounded-full" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-5xl font-black text-white/20 uppercase italic tracking-widest">
              Esperando momentos...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Marca de agua / Instrucción */}
      <div className="absolute top-10 right-10 flex flex-col items-end">
        <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase">
          Envía tus fotos y deseos
        </p>
        <p className="text-white text-3xl font-black">QR EN PANTALLA</p>
      </div>

      <div className="absolute bottom-10 left-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
          <span className="text-white font-black text-xl">R</span>
        </div>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
          Rayuela Live Social
        </p>
      </div>
    </div>
  );
};
