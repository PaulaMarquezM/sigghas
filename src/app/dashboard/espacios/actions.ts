"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, formBoolean, formNumber, formString, type ActionResult } from "@/lib/entities";
import type { TipoEspacio } from "@/types/database";

function payload(formData: FormData) {
  const numero = formString(formData, "numero").replace(/[^0-9A-Za-z-]/g, "");
  const sede_id = formString(formData, "sede_id");
  const tipo = formString(formData, "tipo") as TipoEspacio;
  if (!numero || !sede_id) throw new Error("Indica el número del aula y selecciona una sede.");
  const prefijo = tipo === "laboratorio" ? "Laboratorio" : tipo === "auditorio" ? "Auditorio" : tipo === "sala_reuniones" ? "Sala" : "Aula";
  return {
    nombre: `${prefijo} ${numero}`,
    sede_id,
    tipo,
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
