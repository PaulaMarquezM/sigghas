"use server";

import { createClient } from "@/lib/supabase/server";
import { localizeErrorMessage } from "@/lib/errors";
import { formString, type ActionResult } from "@/lib/entities";
import { redirect } from "next/navigation";

export async function changePassword(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const password = formString(formData, "password");
  const confirm = formString(formData, "confirm");

  if (password.length < 8) {
    return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirm) {
    return { ok: false, message: "Las contraseñas no coinciden." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, message: localizeErrorMessage(error.message, "No se pudo actualizar la contraseña.") };
  }

  const { error: profileError } = await supabase
    .from("perfiles")
    .update({ debe_cambiar_password: false })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, message: localizeErrorMessage(profileError.message, "Contraseña actualizada, pero no se pudo marcar el perfil.") };
  }

  redirect("/dashboard");
}
