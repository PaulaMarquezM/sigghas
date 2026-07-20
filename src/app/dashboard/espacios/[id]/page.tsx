import { notFound } from "next/navigation";
import { EspacioForm } from "@/components/entities/EspacioForm";
import { FormShell } from "@/components/entities/FormShell";
import { updateEspacio } from "@/app/dashboard/espacios/actions";
import { createClient } from "@/lib/supabase/server";
import { asUntypedDb, getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";
import type { Database } from "@/types/database";

type Espacio = Database["public"]["Tables"]["espacios"]["Row"];

export default async function EditarEspacioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol("coordinador", "administrador");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, sedes] = await Promise.all([
    asUntypedDb(supabase).from("espacios").select("*").eq("id", id).single(),
    getSedes(),
  ]);
  if (!data) notFound();
  const espacio = data as Espacio;
  return (
    <FormShell title={`Editar ${espacio.nombre}`} backHref="/dashboard/espacios">
      <EspacioForm action={updateEspacio.bind(null, id)} sedes={sedes} value={espacio} />
    </FormShell>
  );
}
