"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, type ActionResult } from "@/lib/entities";
import { localizeErrorMessage } from "@/lib/errors";
import { payload } from "./validation";

export async function createGrupo(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("grupos").insert(payload(formData));
    if (error) return { ok: false, message: localizeErrorMessage(error.message) };
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
    if (error) return { ok: false, message: localizeErrorMessage(error.message) };
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
  if (error) throw new Error(localizeErrorMessage(error.message));
  revalidatePath("/dashboard/grupos");
}
