import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * "Exportar PDF" en el dashboard apunta aquí para docente y estudiante.
 * El docente puede descargar su propio horario sin pasos previos; el
 * estudiante primero debe elegir su grupo, así que se le manda al selector.
 */
export default async function ReportesRedirectPage() {
  const { perfil } = await getSession();

  if (perfil?.rol === "docente") {
    redirect("/api/pdf/mi-horario");
  }

  redirect("/dashboard/mi-horario");
}
