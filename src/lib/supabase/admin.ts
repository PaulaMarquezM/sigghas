import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RolUsuario } from "@/types/database";
import { requireRol } from "@/lib/auth";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (o SERVICE_ROLE_KEY) en .env.");
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Única forma soportada de obtener un cliente con la service_role key (que
 * bypassea RLS por completo): primero verifica el rol del usuario actual y
 * solo entonces entrega el cliente. Evita que un server action nuevo cree
 * un cliente admin sin pasar por requireRol() antes.
 */
export async function requireRolAndAdminClient(...roles: RolUsuario[]) {
  const perfil = await requireRol(...roles);
  return { perfil, admin: createAdminClient() };
}
