"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, type ActionResult } from "@/lib/entities";
import { localizeErrorMessage } from "@/lib/errors";
import { encontrarMateriaDuplicada, payload } from "./validation";

async function validarNombreUnico(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nombre: string,
  excluirId?: string
): Promise<string | null> {
  const { data, error } = await asUntypedDb(supabase)
    .from("materias")
    .select("id, nombre");
  if (error) return localizeErrorMessage(error.message);

  const duplicada = encontrarMateriaDuplicada(
    nombre,
    (data ?? []) as Array<{ id: string; nombre: string }>,
    excluirId
  );
  if (!duplicada) return null;
  return `Ya existe una materia con un nombre muy similar: "${duplicada.nombre}". Usa ese registro o elige un nombre claramente distinto.`;
}

export async function createMateria(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const data = payload(formData);
    const conflicto = await validarNombreUnico(supabase, data.nombre);
    if (conflicto) return { ok: false, message: conflicto };
    const { error } = await asUntypedDb(supabase).from("materias").insert(data);
    if (error) return { ok: false, message: localizeErrorMessage(error.message) };
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
    const data = payload(formData);
    const conflicto = await validarNombreUnico(supabase, data.nombre, id);
    if (conflicto) return { ok: false, message: conflicto };
    const { error } = await asUntypedDb(supabase).from("materias").update(data).eq("id", id);
    if (error) return { ok: false, message: localizeErrorMessage(error.message) };
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
  if (error) throw new Error(localizeErrorMessage(error.message));
  revalidatePath("/dashboard/materias");
}
