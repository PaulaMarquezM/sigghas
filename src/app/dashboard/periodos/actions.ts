"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, type ActionResult } from "@/lib/entities";
import { payload } from "./validation";

async function deactivateOthers(active: boolean, exceptId?: string) {
  if (!active) return;
  const supabase = await createClient();
  let query = asUntypedDb(supabase).from("periodos").update({ activo: false }).eq("activo", true);
  if (exceptId) query = query.neq("id", exceptId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function createPeriodo(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const data = payload(formData);
    await deactivateOthers(data.activo);
    const { error } = await asUntypedDb(supabase).from("periodos").insert(data);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/periodos");
  redirect("/dashboard/periodos");
}

export async function updatePeriodo(id: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const data = payload(formData);
    await deactivateOthers(data.activo, id);
    const { error } = await asUntypedDb(supabase).from("periodos").update(data).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/periodos");
  redirect("/dashboard/periodos");
}

export async function togglePeriodo(id: string, activo: boolean) {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  await deactivateOthers(activo, id);
  const { error } = await asUntypedDb(supabase).from("periodos").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/periodos");
}
