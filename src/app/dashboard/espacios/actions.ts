"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, formBoolean, formNumber, formString, type ActionResult } from "@/lib/entities";
import type { TipoEspacio } from "@/types/database";

function payload(formData: FormData) {
  const nombre = formString(formData, "nombre");
  const sede_id = formString(formData, "sede_id");
  if (!nombre || !sede_id) throw new Error("Nombre y sede son obligatorios.");
  return {
    nombre,
    sede_id,
    tipo: formString(formData, "tipo") as TipoEspacio,
    capacidad: formNumber(formData, "capacidad", 30),
    accesible: formBoolean(formData, "accesible"),
    tiene_proyector: formBoolean(formData, "tiene_proyector"),
    tiene_internet: formBoolean(formData, "tiene_internet"),
    activo: formBoolean(formData, "activo"),
    disponible: formBoolean(formData, "activo"),
  };
}

export async function createEspacio(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("espacios").insert(payload(formData));
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/espacios");
  redirect("/dashboard/espacios");
}

export async function updateEspacio(id: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { error } = await asUntypedDb(supabase).from("espacios").update(payload(formData)).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/dashboard/espacios");
  redirect("/dashboard/espacios");
}

export async function toggleEspacio(id: string, disponible: boolean) {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("espacios").update({ disponible, activo: disponible }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/espacios");
}
