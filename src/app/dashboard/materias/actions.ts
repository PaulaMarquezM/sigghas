"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, formBoolean, formNumber, formString, type ActionResult } from "@/lib/entities";
import type { ModalidadClase } from "@/types/database";

function payload(formData: FormData) {
  const codigoIngresado = formString(formData, "codigo").toUpperCase();
  const codigo = codigoIngresado || `MAT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const nombre = formString(formData, "nombre");
  if (!nombre) throw new Error("Escribe el nombre de la materia para continuar.");
  const nivel = formNumber(formData, "nivel", 1);
  const horas_teoria = formNumber(formData, "horas_teoria", 0);
  const horas_practica = formNumber(formData, "horas_practica", 0);
  const horas_semana = horas_teoria + horas_practica;
  if (horas_semana <= 0 || horas_semana > 6 || !Number.isInteger(horas_semana * 2)) {
    throw new Error("Revisa las horas de teoría y práctica: juntas deben sumar entre 0,5 y 6 horas, usando intervalos de 30 minutos.");
  }
  const modalidad = formString(formData, "modalidad") as ModalidadClase;
  const requiere_laboratorio = formBoolean(formData, "requiere_laboratorio");
  if (modalidad !== "presencial" && requiere_laboratorio) {
    throw new Error("Una materia virtual o híbrida no usa laboratorio. Desmarca “Requiere laboratorio” o cambia la modalidad a presencial.");
  }
  return {
    codigo,
    nombre,
    semestre: nivel,
    nivel,
    horas_semana,
    horas_teoria,
    horas_practica,
    modalidad,
    requiere_laboratorio,
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
