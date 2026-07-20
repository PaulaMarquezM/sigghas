import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SERVICE_ROLE_KEY;
const supabase = createClient(url, key);
void supabase;

async function run() {
  const sql = `
    create or replace function auth_rol()
    returns rol_usuario language sql stable security definer set search_path = public as $$
      select rol from perfiles where id = auth.uid()
    $$;
  `;
  void sql;
  // wait, supabase-js does not have a raw query method unless we use rpc.
  // We can just put this in a migration file and run supabase db push, or run it through seed?
}
run();
