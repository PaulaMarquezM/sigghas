"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRolAndAdminClient } from "@/lib/supabase/admin";
import { asUntypedDb, errorMessage, formBoolean, formNullableString, formString, type ActionResult } from "@/lib/entities";
import type { RolUsuario } from "@/types/database";

function requireFields(fields: Record<string, string | null>) {
  for (const [label, value] of Object.entries(fields)) {
    if (!value) throw new Error(`${label} es obligatorio.`);
  }
}

export async function createUsuario(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const { admin } = await requireRolAndAdminClient("administrador");

  try {
    const nombre = formString(formData, "nombre");
    const email = formString(formData, "email").toLowerCase();
    const rol = formString(formData, "rol") as RolUsuario;
    const sede_id = formNullableString(formData, "sede_id");

    requireFields({ Nombre: nombre, Email: email, Rol: rol });
    if (rol === "docente") {
      throw new Error("Para crear un docente usa la sección Docentes (necesita datos adicionales de contrato).");
    }

    const tempPassword = crypto.randomUUID();
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nombre, rol },
    });
    if (userError || !userData.user) throw new Error(userError?.message ?? "No se pudo crear el usuario.");

    const { error: profileError } = await asUntypedDb(admin).from("perfiles").upsert({
      id: userData.user.id,
      nombre,
      email,
      rol,
      sede_id,
      activo: true,
    });
    if (profileError) throw new Error(profileError.message);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }

  revalidatePath("/dashboard/usuarios");
  redirect("/dashboard/usuarios");
}

export async function updateUsuario(id: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  const { admin } = await requireRolAndAdminClient("administrador");

  try {
    const rol = formString(formData, "rol") as RolUsuario;
    const sede_id = formNullableString(formData, "sede_id");
    const activo = formBoolean(formData, "activo");

    requireFields({ Rol: rol });
    if (rol === "docente") {
      throw new Error("No se puede asignar el rol docente desde aquí; usa la sección Docentes.");
    }

    const { error } = await asUntypedDb(admin).from("perfiles").update({ rol, sede_id, activo }).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }

  revalidatePath("/dashboard/usuarios");
  redirect("/dashboard/usuarios");
}

export async function toggleUsuario(id: string, activo: boolean) {
  const { admin } = await requireRolAndAdminClient("administrador");
  const { error } = await asUntypedDb(admin).from("perfiles").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/usuarios");
}
