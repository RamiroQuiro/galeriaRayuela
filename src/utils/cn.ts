import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 * Permite usar condicionales y herencia de clases desde componentes padres.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
