import { notFound } from "next/navigation";
import { PeriodoForm } from "@/components/entities/PeriodoForm";
import { FormShell } from "@/components/entities/FormShell";
import { updatePeriodo } from "@/app/dashboard/periodos/actions";
import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth";
import type { Database } from "@/types/database";

type Periodo = Database["public"]["Tables"]["periodos"]["Row"];

export default async function EditarPeriodoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol("coordinador", "administrador");
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await (supabase as any).from("periodos").select("*").eq("id", id).single();
  if (!data) notFound();
  const periodo = data as Periodo;
  return (
    <FormShell title={`Editar ${periodo.nombre}`} backHref="/dashboard/periodos">
      <PeriodoForm action={updatePeriodo.bind(null, id)} value={periodo} />
    </FormShell>
  );
}
