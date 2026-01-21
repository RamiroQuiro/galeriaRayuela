import React, { useState } from "react";
import {
  Camera,
  MessageSquare,
  Send,
  ChevronLeft,
  Image as ImageIcon,
} from "lucide-react";
import { FormularioSubidaPublica } from "../FormularioSubidaPublica";
import { motion, AnimatePresence } from "framer-motion";

interface GuestInteractionFlowProps {
  codigoEvento: string;
  nombreEvento: string;
}

export const GuestInteractionFlow: React.FC<GuestInteractionFlowProps> = ({
  codigoEvento,
  nombreEvento,
}) => {
  const [mode, setMode] = useState<"select" | "photo" | "message">("select");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/eventos/${codigoEvento}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, senderName }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("");
        setTimeout(() => {
          setStatus("idle");
          setMode("select");
        }, 3000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4"
          >
            <button
              onClick={() => setMode("photo")}
              className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all group text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Camera size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-none">
                  Compartir Foto
                </h3>
                <p className="text-sm text-gray-500">
                  Sube tus capturas del evento en vivo
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode("message")}
              className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-purple-500 hover:shadow-md transition-all group text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <MessageSquare size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-none">
                  Enviar Dedicatoria
                </h3>
                <p className="text-sm text-gray-500">
                  Deja un mensaje para los anfitriones
                </p>
              </div>
            </button>
          </motion.div>
        )}

        {mode === "photo" && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <button
              onClick={() => setMode("select")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-2"
            >
              <ChevronLeft size={16} /> Volver al inicio
            </button>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <FormularioSubidaPublica
                codigoEvento={codigoEvento}
                nombreEvento={nombreEvento}
              />
            </div>
          </motion.div>
        )}

        {mode === "message" && (
          <motion.div
            key="message"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <button
              onClick={() => setMode("select")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 mb-2"
            >
              <ChevronLeft size={16} /> Volver al inicio
            </button>

            <form
              onSubmit={handleSendMessage}
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 space-y-6"
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Tu Dedicatoria
                </h3>
                <p className="text-sm text-gray-500">
                  Se mostrará en la pantalla gigante
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Tu Nombre (Opcional)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="ej. Familia Garcia / Juan"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Mensaje
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={160}
                    rows={4}
                    placeholder="Escribe un mensaje lindo..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                  />
                  <p className="text-right text-[10px] text-gray-400 mt-1">
                    {message.length}/160
                  </p>
                </div>

                {status === "success" && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center text-sm font-medium">
                    ¡Mensaje enviado con éxito! ✨
                  </div>
                )}

                {status === "error" && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center text-sm font-medium">
                    Ocurrió un error. Intenta de nuevo.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={20} /> Enviar Dedicatoria
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
