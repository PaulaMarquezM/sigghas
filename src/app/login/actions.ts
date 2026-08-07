"use server";

import { createClient } from "@/lib/supabase/server";
import { localizeErrorMessage } from "@/lib/errors";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email    = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login] signIn falló:", error);
    const msg = localizeErrorMessage(error.message, "Correo o contraseña incorrectos.");
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
