"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRolAndAdminClient } from "@/lib/supabase/admin";
import { consolidarBloquesDisponibilidad } from "@/lib/disponibilidad";
import { asUntypedDb, errorMessage, formBoolean, formNullableString, formNumber, formString, requireFields, type ActionResult } from "@/lib/entities";
import type { TipoContrato } from "@/types/database";

export async function createDocente(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const { admin } = await requireRolAndAdminClient("coordinador", "administrador");

  try {
    const nombre = formString(formData, "nombre");
    const email = formString(formData, "email").toLowerCase();
    const tipo_contrato = formString(formData, "tipo_contrato") as TipoContrato;
    const sede_principal_id = formNullableString(formData, "sede_principal_id");
    const max_horas_semana = formNumber(formData, "max_horas_semana", 20);

    requireFields({ Nombre: nombre, Email: email, Sede: sede_principal_id });

    const tempPassword = crypto.randomUUID();
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (userError || !userData.user) throw new Error(userError?.message ?? "No se pudo crear el usuario docente.");

    const id = userData.user.id;
    const adminDb = asUntypedDb(admin);
    const { error: profileError } = await adminDb.from("perfiles").upsert({
      id,
      nombre,
      email,
      rol: "docente",
      sede_id: sede_principal_id,
      activo: true,
    });
    if (profileError) throw new Error(profileError.message);

    const { error } = await adminDb.from("docentes").insert({
      id,
      tipo_contrato,
      max_horas_semana,
      sede_principal_id,
      hora_entrada: null,
      hora_salida: null,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }

  revalidatePath("/dashboard/docentes");
  redirect("/dashboard/docentes");
}

export async function updateDocente(id: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  const { admin } = await requireRolAndAdminClient("coordinador", "administrador");
  try {
    const tipo_contrato = formString(formData, "tipo_contrato") as TipoContrato;
    const sede_principal_id = formNullableString(formData, "sede_principal_id");
    const max_horas_semana = formNumber(formData, "max_horas_semana", 20);
    const activo = formBoolean(formData, "activo");

    const db = asUntypedDb(admin);
    const { error } = await db
      .from("docentes")
      .update({ tipo_contrato, sede_principal_id, max_horas_semana })
      .eq("id", id);
    if (error) throw new Error(error.message);

    const { error: profileError } = await db.from("perfiles").update({ activo }).eq("id", id);
    if (profileError) throw new Error(profileError.message);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }

  revalidatePath("/dashboard/docentes");
  revalidatePath(`/dashboard/docentes/${id}`);
  redirect("/dashboard/docentes");
}

export async function toggleDocente(id: string, activo: boolean) {
  const { admin } = await requireRolAndAdminClient("coordinador", "administrador");
  const { error } = await asUntypedDb(admin).from("perfiles").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/docentes");
}

export async function saveDisponibilidad(docenteId: string, formData: FormData) {
  const { admin: supabase } = await requireRolAndAdminClient("coordinador");
  const bloques = formData.getAll("bloques").filter((value): value is string => typeof value === "string");

  const { error: deleteError } = await supabase
    .from("disponibilidad_docente")
    .delete()
    .eq("docente_id", docenteId)
    .eq("es_tiempo_oficina", false);
  if (deleteError) throw new Error(deleteError.message);

  if (bloques.length > 0) {
    const rows = consolidarBloquesDisponibilidad(bloques).map((bloque) => ({
        docente_id: docenteId,
        dia_semana: bloque.dia_semana,
        hora_inicio: bloque.hora_inicio,
        hora_fin: bloque.hora_fin,
        es_tiempo_oficina: false,
      }));
    const { error } = await asUntypedDb(supabase).from("disponibilidad_docente").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/dashboard/docentes/${docenteId}/disponibilidad`);
}
