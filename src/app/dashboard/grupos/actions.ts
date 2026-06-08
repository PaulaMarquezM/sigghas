"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, formBoolean, formNumber, formString, type ActionResult } from "@/lib/entities";

function payload(formData: FormData) {
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

export async function createGrupo(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("grupos").insert(payload(formData));
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/grupos");
  redirect("/dashboard/grupos");
}

export async function updateGrupo(id: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("grupos").update(payload(formData)).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/grupos");
  redirect("/dashboard/grupos");
}

export async function toggleGrupo(id: string, activo: boolean) {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("grupos").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/grupos");
}
