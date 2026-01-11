import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { CreateServiceForm } from "./CreateServiceForm";
import { showToast } from "../toast/showToast";
import ModalReact from "../ui/organismo/ModalReact";
import {
  type Service,
  servicesStore,
  setServices,
  removeService,
} from "../../store/servicesStore";

interface ContenedorServiciosProps {
  initialServices: Service[];
}

export default function ContenedorServicios({
  initialServices = [],
}: ContenedorServiciosProps) {
  const misServicios = useStore(servicesStore);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (initialServices && initialServices.length > 0) {
      setServices(initialServices);
    }
  }, []); // Only on mount

  const handleOpenCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

    // Optimistic update
    // removeService(id);

    // TODO: Implement Delete API endpoint
    showToast("Función de eliminar pendiente de implementar backend", {
      background: "bg-orange-500",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl pt-10">
      {misServicios.length === 0 ? (
        <div className="glass-card p-12 text-center border-dashed border-2 border-white/20">
          <div className="bg-white/5 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Aún no ofreces servicios
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Comienza a ofrecer tus servicios a otros organizadores.
          </p>
          <button
            onClick={handleOpenCreate}
            className="bg-linear-to-r from-neon-blue to-neon-purple text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all"
          >
            Crear mi primer servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {misServicios.map((service) => {
            const images = Array.isArray(service.images)
              ? service.images
              : typeof service.images === "string"
              ? JSON.parse(service.images)
              : [];
            const coverImage = images.length > 0 ? images[0] : null;

            return (
              <div
                key={service.id}
                className="glass-card group flex flex-col h-full relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 hover:border-neon-blue/30 transition-all duration-300"
              >
                <div className="h-48 bg-gray-900 relative overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-gray-700">
                      <Plus className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                        service.isActive
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}
                    >
                      {service.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-black/60 text-white border border-white/10 uppercase tracking-widest backdrop-blur-md">
                      {service.category || "General"}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-neon-green font-mono font-bold text-lg leading-none">
                        ${service.price}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">
                        /{service.unit}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                    {service.description || "Sin descripción"}
                  </p>
                  <div className="mt-auto pt-4 border-t border-white/10 flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(service)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-1"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(service.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-400 transition-all flex items-center gap-1"
                      title="Eliminar"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal create/edit */}
      {isModalOpen && (
        <ModalReact
          onClose={() => setIsModalOpen(false)}
          title={editingService ? "Editar Servicio" : "Nuevo Servicio"}
          id="modal-service"
        >
          <CreateServiceForm
            onSuccess={handleSuccess}
            initialData={
              editingService
                ? {
                    ...editingService,
                    description: editingService.description || undefined,
                    category: editingService.category || undefined,
                    // Parse images if needed for the form
                    images: Array.isArray(editingService.images)
                      ? editingService.images
                      : typeof editingService.images === "string"
                      ? JSON.parse(editingService.images)
                      : [],
                  }
                : null
            }
          />
        </ModalReact>
      )}
    </div>
  );
}
