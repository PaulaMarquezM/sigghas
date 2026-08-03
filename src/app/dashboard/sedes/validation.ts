import { formBoolean, formString } from "@/lib/entities";

export function payload(formData: FormData) {
  const nombre = formString(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio.");
  return {
    nombre,
    es_central: formBoolean(formData, "es_central"),
  };
}
