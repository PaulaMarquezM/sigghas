import { formBoolean, formNumber, formString } from "@/lib/entities";
import type { TipoEspacio } from "@/types/database";

export function payload(formData: FormData) {
  const numero = formString(formData, "numero").replace(/[^0-9A-Za-z-]/g, "");
  const sede_id = formString(formData, "sede_id");
  const tipo = formString(formData, "tipo") as TipoEspacio;
  if (!numero || !sede_id) throw new Error("Indica el número del aula y selecciona una sede.");
  const prefijo = tipo === "laboratorio" ? "Laboratorio" : tipo === "auditorio" ? "Auditorio" : tipo === "sala_reuniones" ? "Sala" : "Aula";
  return {
    nombre: `${prefijo} ${numero}`,
    sede_id,
    tipo,
    capacidad: formNumber(formData, "capacidad", 30),
    accesible: formBoolean(formData, "accesible"),
    tiene_proyector: formBoolean(formData, "tiene_proyector"),
    tiene_internet: formBoolean(formData, "tiene_internet"),
    activo: formBoolean(formData, "activo"),
    disponible: formBoolean(formData, "activo"),
  };
}
