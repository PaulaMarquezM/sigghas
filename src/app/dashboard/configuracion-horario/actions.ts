"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { asUntypedDb, formBoolean, formString } from "@/lib/entities";
import { createClient } from "@/lib/supabase/server";

export async function guardarAsignacionDocente(formData: FormData) {
  await requireRol("coordinador", "administrador");
  const periodo_id = formString(formData, "periodo_id");
  const materia_id = formString(formData, "materia_id");
  const grupo_id = formString(formData, "grupo_id");
  const docente_id = formString(formData, "docente_id");
  if (!periodo_id || !materia_id || !grupo_id || !docente_id) throw new Error("Completa período, materia, grupo y docente.");
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("asignaciones_docente_periodo").upsert({ periodo_id, materia_id, grupo_id, docente_id });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/configuracion-horario");
  revalidatePath("/dashboard/generar");
}

export async function eliminarAsignacionDocente(periodoId: string, materiaId: string, grupoId: string) {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("asignaciones_docente_periodo")
    .delete().eq("periodo_id", periodoId).eq("materia_id", materiaId).eq("grupo_id", grupoId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/configuracion-horario");
  revalidatePath("/dashboard/generar");
}

export async function guardarDisponibilidadEspacio(formData: FormData) {
  await requireRol("coordinador", "administrador");
  const espacio_id = formString(formData, "espacio_id");
  const dia_semana = Number(formString(formData, "dia_semana"));
  const hora_inicio = formString(formData, "hora_inicio");
  const hora_fin = formString(formData, "hora_fin");
  if (!espacio_id || !Number.isInteger(dia_semana) || dia_semana < 1 || dia_semana > 6 || !hora_inicio || !hora_fin || hora_inicio >= hora_fin) {
    throw new Error("Indica una franja válida para el espacio.");
  }
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("disponibilidad_espacio").insert({ espacio_id, dia_semana, hora_inicio, hora_fin, disponible: formBoolean(formData, "disponible") });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/configuracion-horario");
  revalidatePath("/dashboard/generar");
}

export async function actualizarDisponibilidadEspacio(id: string, formData: FormData) {
  await requireRol("coordinador", "administrador");
  const dia_semana = Number(formString(formData, "dia_semana"));
  const hora_inicio = formString(formData, "hora_inicio");
  const hora_fin = formString(formData, "hora_fin");
  if (!Number.isInteger(dia_semana) || dia_semana < 1 || dia_semana > 6 || !hora_inicio || !hora_fin || hora_inicio >= hora_fin) {
    throw new Error("Indica una franja válida para el espacio.");
  }
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("disponibilidad_espacio")
    .update({ dia_semana, hora_inicio, hora_fin, disponible: formBoolean(formData, "disponible") })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/configuracion-horario");
  revalidatePath("/dashboard/generar");
}

export async function eliminarDisponibilidadEspacio(id: string) {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("disponibilidad_espacio").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/configuracion-horario");
  revalidatePath("/dashboard/generar");
}
