import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convierte escapes que llegan desde servicios externos en texto legible para la interfaz. */
export function mensajeLegible(mensaje: string | null | undefined): string {
  if (!mensaje) return "Ocurrió un error inesperado. Inténtalo nuevamente.";

  try {
    const valor = JSON.parse(mensaje);
    if (typeof valor === "string") return valor;
  } catch {
    // El mensaje no es un JSON completo; se decodifican los escapes puntuales abajo.
  }

  return mensaje
    .replace(/\\u([0-9a-f]{4})/gi, (_, codigo: string) => String.fromCharCode(Number.parseInt(codigo, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\\"/g, "\"");
}
