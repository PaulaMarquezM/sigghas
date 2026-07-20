import { notFound } from "next/navigation";
import { GrupoForm } from "@/components/entities/GrupoForm";
import { FormShell } from "@/components/entities/FormShell";
import { updateGrupo } from "@/app/dashboard/grupos/actions";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";
import type { Database } from "@/types/database";

type Grupo = Database["public"]["Tables"]["grupos"]["Row"];

export default async function EditarGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol("coordinador", "administrador");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, sedes] = await Promise.all([
    asUntypedDb(supabase).from("grupos").select("*").eq("id", id).single(),
    getSedes(),
  ]);
  if (!data) notFound();
  const grupo = data as Grupo;
  return (
    <FormShell title={`Editar ${grupo.nombre}`} backHref="/dashboard/grupos">
      <GrupoForm action={updateGrupo.bind(null, id)} sedes={sedes} value={grupo} />
    </FormShell>
  );
}
