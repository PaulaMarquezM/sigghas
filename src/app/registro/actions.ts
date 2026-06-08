"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { RolUsuario } from "@/types/database";

export async function register(formData: FormData) {
  const supabase = await createClient();

  // Origen de la app para construir el enlace de confirmación
  const hdrs = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("host")}`;

  const nombre   = (formData.get("nombre")   as string).trim();
  const email    = (formData.get("email")    as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const rol      = ((formData.get("rol") as string) || "estudiante") as RolUsuario;

  // Crear usuario en Supabase Auth. El perfil lo crea automáticamente
  // el trigger handle_new_user a partir de esta metadata (ver
  // migración 003), por lo que no insertamos en `perfiles` aquí.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, rol },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.user) {
    console.error("[registro] signUp falló:", error);
    const msg = error?.message?.includes("already registered")
      ? "Este correo ya tiene una cuenta. Inicia sesión."
      : `No se pudo crear la cuenta: ${error?.message ?? "respuesta vacía de Supabase"}`;
    redirect(`/registro?error=${encodeURIComponent(msg)}`);
  }

  // Si hay sesión inmediata → dashboard; si pide confirmación → login
  if (data.session) {
    redirect("/dashboard");
  } else {
    const msg = "Cuenta creada. Te enviamos un correo de confirmación: ábrelo y confirma tu cuenta antes de iniciar sesión.";
    redirect(`/login?msg=${encodeURIComponent(msg)}`);
  }
}
