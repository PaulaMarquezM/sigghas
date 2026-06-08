"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { RolUsuario } from "@/types/database";

export async function register(formData: FormData) {
  const supabase = await createClient();

  const nombre   = formData.get("nombre")   as string;
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;
  const rol      = ((formData.get("rol") as string) || "estudiante") as RolUsuario;

  // 1. Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    const msg = error?.message?.includes("already registered")
      ? "Este correo ya tiene una cuenta. Inicia sesión."
      : "No se pudo crear la cuenta. Intenta de nuevo.";
    redirect(`/registro?error=${encodeURIComponent(msg)}`);
  }

  // 2. Insertar perfil con rol
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: perfilError } = await (supabase as any)
    .from("perfiles")
    .insert({
      id:      data.user!.id,
      nombre:  nombre.trim(),
      email:   email.trim().toLowerCase(),
      rol,
      sede_id: null,
      activo:  true,
    });

  if (perfilError) {
    redirect(`/registro?error=${encodeURIComponent("Cuenta creada pero no se guardó el perfil. Contacta al administrador.")}`);
  }

  // 3. Redirigir: si hay sesión inmediata → dashboard, si pide confirmación → login
  if (data.session) {
    redirect("/dashboard");
  } else {
    redirect("/login?msg=Revisa+tu+correo+para+confirmar+tu+cuenta");
  }
}
