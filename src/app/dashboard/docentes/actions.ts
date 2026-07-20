"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, errorMessage, formBoolean, formNullableString, formNumber, formString, type ActionResult } from "@/lib/entities";
import type { Database, TipoContrato } from "@/types/database";

function requireFields(fields: Record<string, string | null>) {
  for (const [label, value] of Object.entries(fields)) {
    if (!value) throw new Error(`${label} es obligatorio.`);
  }
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (o SERVICE_ROLE_KEY) en .env para crear usuarios docentes.");
  }
  return createAdminClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createDocente(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRol("coordinador", "administrador");

  try {
    const nombre = formString(formData, "nombre");
    const email = formString(formData, "email").toLowerCase();
    const tipo_contrato = formString(formData, "tipo_contrato") as TipoContrato;
    const sede_principal_id = formNullableString(formData, "sede_principal_id");
    const max_horas_semana = formNumber(formData, "max_horas_semana", 20);

    requireFields({ Nombre: nombre, Email: email, Sede: sede_principal_id });

    const admin = getAdminClient();
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
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  try {
    const tipo_contrato = formString(formData, "tipo_contrato") as TipoContrato;
    const sede_principal_id = formNullableString(formData, "sede_principal_id");
    const max_horas_semana = formNumber(formData, "max_horas_semana", 20);
    const activo = formBoolean(formData, "activo");

    const db = asUntypedDb(supabase);
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
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();
  const { error } = await asUntypedDb(supabase).from("perfiles").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/docentes");
}

export async function saveDisponibilidad(docenteId: string, formData: FormData) {
  await requireRol("coordinador");
  const supabase = await createClient();
  const bloques = formData.getAll("bloques").filter((value): value is string => typeof value === "string");

  const { error: deleteError } = await supabase
    .from("disponibilidad_docente")
    .delete()
    .eq("docente_id", docenteId)
    .eq("es_tiempo_oficina", false);
  if (deleteError) throw new Error(deleteError.message);

  if (bloques.length > 0) {
    const rows = bloques.map((bloque) => {
      const [dia, hora] = bloque.split("-");
      const inicio = hora.slice(0, 5);
      const [hour, minute] = inicio.split(":").map(Number);
      const finMinutos = hour * 60 + minute + 30;
      return {
        docente_id: docenteId,
        dia_semana: Number(dia),
        hora_inicio: inicio,
        hora_fin: `${String(Math.floor(finMinutos / 60)).padStart(2, "0")}:${String(finMinutos % 60).padStart(2, "0")}`,
        es_tiempo_oficina: false,
      };
    });
    const { error } = await asUntypedDb(supabase).from("disponibilidad_docente").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/dashboard/docentes/${docenteId}/disponibilidad`);
}
