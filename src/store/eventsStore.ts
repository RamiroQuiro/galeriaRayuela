import { atom } from "nanostores";
import type { events } from "../db/schemas";

// Infer type from schema if possible, or define a simple one
export interface Event {
  id: number;
  name: string;
  codigoAcceso: string;
  imagenPortada: string | null;
  estado: string | null;
  createdAt: Date | null;
  tenantId: string | null;
}

export const eventsStore = atom<Event[]>([]);

export const setEvents = (events: Event[]) => {
  eventsStore.set(events);
};

export const addEvent = (event: Event) => {
  eventsStore.set([event, ...eventsStore.get()]);
};

export const updateEvent = (updatedEvent: Event) => {
  const currentEvents = eventsStore.get();
  const index = currentEvents.findIndex((e) => e.id === updatedEvent.id);
  if (index !== -1) {
    const newEvents = [...currentEvents];
    newEvents[index] = updatedEvent;
    eventsStore.set(newEvents);
  }
};

export const deleteEventStore = (eventId: number) => {
  eventsStore.set(eventsStore.get().filter(e => e.id !== eventId));
};

export const traerEventos = async () => {
  try {
    const response = await fetch("/api/events");
    const events = await response.json();
    setEvents(events);
  } catch (error) {
    console.error("Error fetching events:", error);
  }
};