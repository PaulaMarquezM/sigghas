"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, type ActionResult } from "@/lib/entities";
import { payload } from "./validation";

type PeriodoFechas = { id: string; nombre: string; fecha_inicio: string; fecha_fin: string };

async function validarSinSolapamiento(
  periodo: Pick<PeriodoFechas, "fecha_inicio" | "fecha_fin">,
  exceptId?: string,
) {
  const supabase = await createClient();
  const { data, error } = await asUntypedDb(supabase).from("periodos").select("id,nombre,fecha_inicio,fecha_fin");
  if (error) throw new Error(error.message);
  const periodos = Array.isArray(data) ? data as PeriodoFechas[] : [];
  const conflicto = periodos.find((existente) => (
    existente.id !== exceptId &&
    periodo.fecha_inicio <= existente.fecha_fin &&
    existente.fecha_inicio <= periodo.fecha_fin
  ));
  if (conflicto) {
    throw new Error(`Las fechas se superponen con el período ${conflicto.nombre} (${conflicto.fecha_inicio} a ${conflicto.fecha_fin}).`);
  }
}

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
    await validarSinSolapamiento(data);
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
    await validarSinSolapamiento(data, id);
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
  if (activo) {
    const { data, error } = await asUntypedDb(supabase).from("periodos").select("id,nombre,fecha_inicio,fecha_fin").eq("id", id).single();
    if (error || !data) throw new Error(error?.message ?? "No se encontró el período.");
    await validarSinSolapamiento(data as PeriodoFechas, id);
  }
  await deactivateOthers(activo, id);
  const { error } = await asUntypedDb(supabase).from("periodos").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/periodos");
}
