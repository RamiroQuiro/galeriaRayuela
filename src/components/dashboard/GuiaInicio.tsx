import {
  Calendar,
  Printer,
  Upload,
  Eye,
  MonitorPlay,
  CheckCircle2,
} from "lucide-react";

export function GuiaInicio() {
  const pasos = [
    {
      numero: 1,
      titulo: "Crea tu Evento",
      descripcion: "Define el nombre y la fecha. Es el corazón de tu galería.",
      icono: <Calendar className="w-5 h-5 text-neon-blue" />,
      accion: "Crear Evento",
    },
    {
      numero: 2,
      titulo: "Imprime el QR",
      descripcion:
        "Descarga el póster oficial o el QR para que tus invitados lo escaneen.",
      icono: <Printer className="w-5 h-5 text-neon-purple" />,
    },
    {
      numero: 3,
      titulo: "Sube Fotos",
      descripcion:
        "Usa el enlace público para cargar las primeras fotos de prueba.",
      icono: <Upload className="w-5 h-5 text-neon-pink" />,
    },
    {
      numero: 4,
      titulo: "Abre la Galería",
      descripcion: "Visualiza las fotos en tiempo real en el panel de control.",
      icono: <Eye className="w-5 h-5 text-green-400" />,
    },
    {
      numero: 5,
      titulo: "Proyecta en Vivo",
      descripcion:
        "¡Recomendado! Conecta una pantalla y proyecta el modo presentación.",
      icono: <MonitorPlay className="w-5 h-5 text-yellow-400" />,
      destacado: true,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          ¡Bienvenido a Rayuela! 🚀
        </h3>
        <p className="text-gray-400">
          Sigue estos pasos para crear tu primera experiencia inolvidable.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {pasos.map((paso) => (
          <div
            key={paso.numero}
            className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
              paso.destacado
                ? "bg-linear-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
                : "bg-white/5 border-white/10"
            }`}
          >
            {/* Número Pasos */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-lg">
              {paso.numero}
            </div>

            {/* Contenido */}
            <div className="flex-1">
              <h4
                className={`font-bold text-lg flex items-center gap-2 ${
                  paso.destacado ? "text-yellow-200" : "text-white"
                }`}
              >
                {paso.icono}
                {paso.titulo}
              </h4>
              <p className="text-sm text-gray-400 mt-1">{paso.descripcion}</p>
            </div>

            {/* Check Decorativo (Simulado por ahora) */}
            <div className="opacity-20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
