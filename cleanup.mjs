import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  // 1. Get all profiles that are docentes
  const { data: profiles } = await supabase.from("perfiles").select("id").eq("rol", "docente");
  
  // 2. Get all actual docentes
  const { data: docentes } = await supabase.from("docentes").select("id");
  
  const profileIds = new Set(profiles.map(p => p.id));
  const docenteIds = new Set(docentes.map(d => d.id));
  
  // Find profiles that don't have a docente record
  const orphanedIds = [...profileIds].filter(id => !docenteIds.has(id));
  
  console.log("Orphaned IDs:", orphanedIds);
  
  for (const id of orphanedIds) {
    console.log("Deleting orphaned user:", id);
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) console.error("Error deleting", id, error);
    else console.log("Deleted successfully.");
  }
}
run();
