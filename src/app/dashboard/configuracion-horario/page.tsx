import { redirect } from "next/navigation";

/** La configuración forma parte del flujo de generación de horario. */
export default function ConfiguracionHorarioPage() {
  redirect("/dashboard/generar#configuracion");
}
