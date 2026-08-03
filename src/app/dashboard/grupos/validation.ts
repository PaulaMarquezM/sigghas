import { formBoolean, formNumber, formString } from "@/lib/entities";

export function payload(formData: FormData) {
  const nombre = formString(formData, "nombre").toUpperCase();
  const sede_id = formString(formData, "sede_id");
  if (!nombre || !sede_id) throw new Error("Nombre y sede son obligatorios.");
  return {
    nombre,
    sede_id,
    semestre: formNumber(formData, "semestre", 1),
    cantidad_estudiantes: formNumber(formData, "cantidad_estudiantes", 0),
    requiere_accesibilidad: formBoolean(formData, "requiere_accesibilidad"),
    activo: formBoolean(formData, "activo"),
  };
}
