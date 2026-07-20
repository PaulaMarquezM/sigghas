import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Solo debe usarse en código de servidor después de verificar el rol. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (o SERVICE_ROLE_KEY) en .env.");
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
