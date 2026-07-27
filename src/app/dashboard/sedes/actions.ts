"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, formBoolean, formString, type ActionResult } from "@/lib/entities";

function payload(formData: FormData) {
  const nombre = formString(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio.");
  return {
    nombre,
    es_central: formBoolean(formData, "es_central"),
  };
}

export async function createSede(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("sedes").insert(payload(formData));
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/sedes");
  redirect("/dashboard/sedes");
}

export async function updateSede(id: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("sedes").update(payload(formData)).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/sedes");
  redirect("/dashboard/sedes");
}
