"use server";

import { revalidatePath } from "next/cache";
import { requireRolAndAdminClient } from "@/lib/supabase/admin";
import { asUntypedDb } from "@/lib/entities";
import { localizeErrorMessage } from "@/lib/errors";

export async function crearMatricula(input: { estudiante_id: string; periodo_id: string; materia_id: string; grupo_id: string; motivo: string }) {
  const { admin } = await requireRolAndAdminClient("coordinador", "administrador");
  if (!input.estudiante_id || !input.periodo_id || !input.materia_id || !input.grupo_id) return { ok: false, message: "Completa estudiante, período, materia y curso." };
  const db = asUntypedDb(admin);
  const { error: estudianteError } = await db.from("estudiantes").upsert({ id: input.estudiante_id });
  if (estudianteError) {
    return {
      ok: false,
      message: `No se pudo preparar el perfil de estudiante: ${localizeErrorMessage(estudianteError.message)}`,
    };
  }
  const { error } = await db.from("matriculas_estudiante").insert(input);
  if (error) return { ok: false, message: localizeErrorMessage(error.message) };
  revalidatePath("/dashboard/matriculas");
  revalidatePath("/dashboard/mi-horario");
  return { ok: true, message: "Matrícula registrada. El estudiante ya puede ver su horario." };
}
