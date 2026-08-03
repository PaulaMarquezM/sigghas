"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, type ActionResult } from "@/lib/entities";
import { payload } from "./validation";

export async function createEspacio(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const { data: aula, error } = await asUntypedDb(supabase).from("espacios").insert(payload(formData)).select("id").single();
    if (error || !aula) return { ok: false, message: error?.message ?? "No se pudo crear el aula." };
    const aulaId = (aula as { id: string }).id;
    const franjas = [1, 2, 3, 4, 5].map((dia_semana) => ({
      espacio_id: aulaId,
      dia_semana,
      hora_inicio: "08:00",
      hora_fin: "17:00",
      disponible: true,
    }));
    const { error: disponibilidadError } = await asUntypedDb(supabase).from("disponibilidad_espacio").insert(franjas);
    if (disponibilidadError) return { ok: false, message: `El aula se creó, pero no se pudo configurar su horario de lunes a viernes: ${disponibilidadError.message}` };
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
