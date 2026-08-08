import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { RolUsuario } from "@/types/database";

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  sede_id: string | null;
  activo: boolean;
  debe_cambiar_password: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Session {
  user: User;
  perfil: Perfil | null;
}

/** Obtiene el usuario y su perfil desde el servidor. Redirige al login si no está autenticado. */
export async function getSession(): Promise<Session> {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol, sede_id, activo, debe_cambiar_password, creado_en, actualizado_en")
    .eq("id", user.id)
    .single();

  return { user, perfil: data as Perfil | null };
}

/** Verifica que el usuario tenga uno de los roles permitidos. */
export async function requireRol(...roles: RolUsuario[]): Promise<Perfil> {
  const { perfil } = await getSession();
  if (!perfil || !roles.includes(perfil.rol)) {
    redirect("/dashboard");
  }
  return perfil;
}

/** Etiquetas legibles para cada rol */
export const LABEL_ROL: Record<RolUsuario, string> = {
  coordinador:   "Coordinador Académico",
  docente:       "Docente",
  estudiante:    "Estudiante",
  administrador: "Administrador",
  apoyo:         "Personal de Apoyo",
};
