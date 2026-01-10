import { Button } from "../ui/Button";
import { MonitorPlay } from "lucide-react";

type Props = {
  eventoId: number;
};

export default function BotonProyectar({ eventoId }: Props) {
  const abrirProyeccion = () => {
    // Abrir en nueva ventana sin barras de navegación
    const width = window.screen.width;
    const height = window.screen.height;
    const features = `
      width=${width},
      height=${height},
      left=0,
      top=0,
      fullscreen=yes,
      toolbar=no,
      menubar=no,
      scrollbars=no,
      resizable=no,
      location=no,
      status=no
    `;

    // Usar la ruta de Astro que renderiza la proyección
    window.open(`/events/${eventoId}/live`, `proyeccion_${eventoId}`, features);
  };

  return (
    <Button onClick={abrirProyeccion} variant="primary" size="sm">
      <MonitorPlay className="w-4 h-4 mr-2" />
      Proyectar
    </Button>
  );
}
