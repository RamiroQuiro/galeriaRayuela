import Button from "../../../components/ui/Button";
import { useEffect, useState } from "react";

interface WhatsAppSetupProps {
  centroMedicoId: string;
}

export default function WhatsAppSetup({ centroMedicoId }: WhatsAppSetupProps) {
  const [status, setStatus] = useState<
    "disconnected" | "qr_pending" | "connected"
  >("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar estado inicial
  useEffect(() => {
    const checkInitial = async () => {
      try {
        const response = await fetch("/api/whatsapp/get-qr");
        const data = await response.json();
        if (data.status === "success" && data.data.status !== "disconnected") {
          setStatus(data.data.status);
          setQrCode(data.data.qrCode);
        }
      } catch (err) {}
    };
    checkInitial();
  }, []);

  // Polling para obtener el QR y estado
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "qr_pending") {
      interval = setInterval(async () => {
        try {
          const response = await fetch("/api/whatsapp/get-qr");
          const data = await response.json();
          console.log("[WhatsApp Poll]", data);

          if (data.status === "success") {
            setStatus(data.data.status);
            setQrCode(data.data.qrCode);

            if (data.data.status === "connected") {
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error("Error obteniendo QR:", err);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const handleInitSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/init-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.status === "success") {
        setStatus("qr_pending");
      } else {
        setError(data.msg || "Error al iniciar sesion");
      }
    } catch (err) {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/disconnect", {
        method: "POST",
      });

      const data = await response.json();

      if (data.status === "success") {
        setStatus("disconnected");
        setQrCode(null);
      } else {
        setError(data.msg || "Error al desconectar");
      }
    } catch (err) {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {status === "disconnected" && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Conecta tu WhatsApp para recibir mensajes de pacientes directamente
            en tu telefono.
          </p>
          <Button
            onClick={handleInitSession}
            disabled={loading}
            variant="indigo"
            className="w-full"
          >
            {loading ? "Iniciando..." : "Conectar WhatsApp"}
          </Button>
        </div>
      )}

      {status === "qr_pending" && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Escanea este codigo QR con WhatsApp en tu telefono
          </p>
          <div className="flex justify-center">
            {qrCode ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
                alt="QR Code"
                className="border-4 border-gray-200 rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 text-center">
            Abre WhatsApp, ve a Dispositivos vinculados y escanea este codigo
          </p>
        </div>
      )}

      {status === "connected" && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            WhatsApp conectado correctamente
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Sesion activa</span>
          </div>
          <Button
            onClick={handleDisconnect}
            disabled={loading}
            variant="cancel"
            className="w-full"
          >
            {loading ? "Desconectando..." : "Desconectar WhatsApp"}
          </Button>
        </div>
      )}
    </div>
  );
}
