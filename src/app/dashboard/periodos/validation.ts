import { formBoolean, formString } from "@/lib/entities";

export function payload(formData: FormData) {
  const nombre = formString(formData, "nombre").toUpperCase();
  const fecha_inicio = formString(formData, "fecha_inicio");
  const fecha_fin = formString(formData, "fecha_fin");
  if (!nombre || !fecha_inicio || !fecha_fin) throw new Error("Todos los campos del periodo son obligatorios.");
  if (fecha_inicio >= fecha_fin) throw new Error("La fecha de inicio debe ser menor que la fecha de fin.");
  return { nombre, fecha_inicio, fecha_fin, activo: formBoolean(formData, "activo") };
}
