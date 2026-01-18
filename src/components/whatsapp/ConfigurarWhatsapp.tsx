import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  QrCode,
  LogOut,
  CheckCircle2,
  RotateCw,
  AlertCircle,
  X,
} from "lucide-react";
import { showToast } from "../toast/showToast";

interface WhatsappStatus {
  estado: "no_configurado" | "pendiente" | "activo" | "desconectado" | "error";
  numero?: string;
  qr?: string;
  sessionUserId?: string;
  currentUserId?: string;
}

export const ConfigurarWhatsapp: React.FC = () => {
  const [status, setStatus] = useState<WhatsappStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [vinculando, setVinculando] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Consultar estado inicial y polling
  const fetchStatus = async () => {
    try {
      // Timestamp para evitar cache del navegador
      const resp = await fetch(`/api/whatsapp/estado?t=${Date.now()}`);
      const data = await resp.json();
      if (data.success) {
        console.log("[WhatsApp Debug] Estado:", data.data);
        setStatus(data.data);

        // Si el estado pasa a activo, cerramos el modal automáticamente
        if (data.data.estado === "activo" && showModal) {
          setShowModal(false);
          showToast("¡WhatsApp vinculado con éxito! 🎉");
        }
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Polling si el estado es pendiente o acabamos de darle a vincular o el modal está abierto
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status?.estado === "pendiente" || vinculando || showModal) {
      interval = setInterval(fetchStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [status?.estado, vinculando, showModal]);

  const handleVincular = async () => {
    setVinculando(true);
    setShowModal(true); // Abrimos el modal inmediatamente
    try {
      const resp = await fetch("/api/whatsapp/vincular", { method: "POST" });
      const data = await resp.json();
      if (data.success) {
        showToast("Iniciando vinculación...");
        await fetchStatus();
      } else {
        showToast(`Error: ${data.message || "No se pudo iniciar"}`);
        setShowModal(false);
      }
    } catch (error) {
      showToast("Error de red");
      setShowModal(false);
    } finally {
      setVinculando(false);
    }
  };

  const handleDesvincular = async () => {
    if (!confirm("¿Seguro que quieres desvincular tu WhatsApp?")) return;

    try {
      const resp = await fetch("/api/whatsapp/desvincular", { method: "POST" });
      const data = await resp.json();
      if (data.success) {
        showToast("WhatsApp desvinculado");
        fetchStatus();
      }
    } catch (error) {
      showToast("Error al desvincular");
    }
  };

  if (loading)
    return (
      <div className="animate-pulse h-24 bg-white/5 rounded-xl border border-white/10" />
    );

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-green-500/10 blur-3xl rounded-full transition-all group-hover:scale-150" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${
              status?.estado === "activo"
                ? "bg-green-500/20 text-green-400"
                : "bg-white/5 text-gray-400"
            }`}
          >
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              WhatsApp para el Evento
              {status?.estado === "activo" && (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              )}
            </h3>
            <p className="text-gray-400 text-sm">
              {status?.estado === "activo"
                ? `Conectado al número: ${status.numero}`
                : "Recibe fotos directamente desde WhatsApp sin apps adicionales."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {status?.estado === "activo" ? (
            <button
              onClick={handleDesvincular}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Desvincular
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStatus}
                className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all border border-white/5"
                title="Actualizar"
              >
                <RotateCw className={`w-4 h-4 ${status?.estado === "pendiente" ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleVincular}
                disabled={vinculando}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
                  status?.estado === "pendiente"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 ring-1 ring-yellow-400/50"
                    : "bg-green-500 text-white hover:bg-green-600 shadow-green-500/20"
                }`}
              >
                <QrCode className="w-4 h-4" />
                {status?.estado === "pendiente" ? "Ver QR Pendiente" : "Vincular WhatsApp"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DEL QR - USANDO FIXED DIRECTAMENTE PARA EVITAR PROBLEMAS DE Z-INDEX */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-midnight-950/95 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden border border-white/20">
            {/* Círculo decorativo */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full" />

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="bg-green-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-green-500/20">
                <QrCode className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                Vincular
                <br />
                WhatsApp
              </h2>
              <p className="text-slate-500 text-sm mb-8 px-4 font-medium">
                Escanea el código con tu celular para activar la recepción de fotos.
              </p>

              <div className="bg-slate-50 p-6 rounded-[2rem] inline-block shadow-inner border border-slate-100 mb-8 min-h-[250px] min-w-[250px] flex items-center justify-center">
                {status?.qr ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(status.qr)}`}
                    alt="WhatsApp QR"
                    className="w-56 h-56 mx-auto rounded-xl shadow-sm animate-fadeIn"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 blur-xl animate-pulse rounded-full" />
                      <RotateCw className="w-12 h-12 text-green-500 animate-spin relative" />
                    </div>
                    <p className="text-[11px] uppercase font-black text-slate-400 tracking-[0.2em] animate-pulse">
                      Generando QR...
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
                  <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                    1. Abre WhatsApp en tu celular<br />
                    2. Ve a <b>Dispositivos vinculados</b><br />
                    3. Pulsa en <b>Vincular un dispositivo</b>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-red-500 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Usa una cuenta no personal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info Panel */}
      <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center">
        <div className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[9px] font-mono text-gray-500 uppercase tracking-wider">
          Support Info
        </div>
        <div className="text-[10px] font-mono text-gray-400 flex flex-wrap gap-x-6 gap-y-2">
          <p>
            <span className="text-gray-600">User:</span>{" "}
            {status?.currentUserId || "..."}
          </p>
          <p>
            <span className="text-gray-600">Session:</span>{" "}
            {status?.sessionUserId || "..."}
          </p>
          <p>
            <span className="text-gray-600">Status:</span>{" "}
            <span
              className={
                status?.estado === "activo"
                  ? "text-green-500"
                  : status?.estado === "pendiente"
                  ? "text-yellow-500"
                  : "text-gray-500"
              }
            >
              {status?.estado || "..."}
            </span>
          </p>
          <p>
            <span className="text-gray-600">QR:</span>{" "}
            {status?.qr ? "READY" : "WAITING"}
          </p>
        </div>
      </div>
    </section>
  );
};
