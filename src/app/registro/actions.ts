"use server";

import { redirect } from "next/navigation";

/** El auto-registro público está deshabilitado: los docentes los crea el coordinador. */
export async function register() {
  redirect(
    `/registro?error=${encodeURIComponent(
      "Los docentes son registrados por el coordinador. Usa iniciar sesión con la contraseña temporal que te compartieron.",
    )}`,
  );
}
