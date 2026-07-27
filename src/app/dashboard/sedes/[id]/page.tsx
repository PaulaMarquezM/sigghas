import { notFound } from "next/navigation";
import { SedeForm } from "@/components/entities/SedeForm";
import { FormShell } from "@/components/entities/FormShell";
import { updateSede } from "@/app/dashboard/sedes/actions";
import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth";
import type { Database } from "@/types/database";

type Sede = Database["public"]["Tables"]["sedes"]["Row"];

export default async function EditarSedePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol("administrador");
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("sedes").select("*").eq("id", id).single();
  if (!data) notFound();
  const sede = data as Sede;
  return (
    <FormShell title={`Editar ${sede.nombre}`} backHref="/dashboard/sedes">
      <SedeForm action={updateSede.bind(null, id)} value={sede} />
    </FormShell>
  );
}
