import { atom } from "nanostores";

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string | null;
  images: any; // Se guarda como JSON string en BD, pero aquí lo manejamos como venga
  isActive: boolean | null;
  tenantId: string;
}

export const servicesStore = atom<Service[]>([]);

export function setServices(services: Service[]) {
  servicesStore.set(services);
}

export function addService(service: Service) {
  servicesStore.set([service, ...servicesStore.get()]);
}

export function updateService(updatedService: Service) {
  const currentServices = servicesStore.get();
  const index = currentServices.findIndex((s) => s.id === updatedService.id);
  if (index !== -1) {
    const newServices = [...currentServices];
    newServices[index] = updatedService;
    servicesStore.set(newServices);
  }
}

export function removeService(id: number) {
  servicesStore.set(servicesStore.get().filter((s) => s.id !== id));
}

// Fetch helper similar to traerEventos if needed, but usually initial load is SSR
// We can add a client-side fetcher if needed
export const fetchServices = async () => {
    try {
        const res = await fetch("/api/services"); // We might need a GET endpoint if we want client-side refresh
        if (res.ok) {
            const data = await res.json();
            // Assuming API returns { data: Service[] } or similar structure, adjust as needed
            // For now, simple placeholder if we implement GET api
            // setServices(data);
        }
    } catch (e) {
        console.error(e);
    }
}
