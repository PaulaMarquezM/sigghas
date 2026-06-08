"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, formBoolean, formNumber, formString, type ActionResult } from "@/lib/entities";
import type { ModalidadClase } from "@/types/database";

function payload(formData: FormData) {
  const codigo = formString(formData, "codigo").toUpperCase();
  const nombre = formString(formData, "nombre");
  if (!codigo || !nombre) throw new Error("Código y nombre son obligatorios.");
  const nivel = formNumber(formData, "nivel", 1);
  const horas_teoria = formNumber(formData, "horas_teoria", 0);
  const horas_practica = formNumber(formData, "horas_practica", 0);
  if (horas_teoria + horas_practica <= 0) throw new Error("La materia debe tener al menos una hora de teoría o práctica.");
  return {
    codigo,
    nombre,
    semestre: nivel,
    nivel,
    horas_semana: horas_teoria + horas_practica,
    horas_teoria,
    horas_practica,
    modalidad: formString(formData, "modalidad") as ModalidadClase,
    requiere_laboratorio: formBoolean(formData, "requiere_laboratorio"),
    activo: formBoolean(formData, "activo"),
  };
}

export async function createMateria(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("materias").insert(payload(formData));
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/materias");
  redirect("/dashboard/materias");
}

export async function updateMateria(id: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("materias").update(payload(formData)).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/materias");
  redirect("/dashboard/materias");
}

export async function toggleMateria(id: string, activo: boolean) {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("materias").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/materias");
}
