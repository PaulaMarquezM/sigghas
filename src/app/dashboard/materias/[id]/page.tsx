import { notFound } from "next/navigation";
import { MateriaForm } from "@/components/entities/MateriaForm";
import { FormShell } from "@/components/entities/FormShell";
import { updateMateria } from "@/app/dashboard/materias/actions";
import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth";
import { asUntypedDb } from "@/lib/entities";
import type { Database } from "@/types/database";

type Materia = Database["public"]["Tables"]["materias"]["Row"];

export default async function EditarMateriaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol("coordinador", "administrador");
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await asUntypedDb(supabase).from("materias").select("*").eq("id", id).single();
  if (!data) notFound();
  const materia = data as Materia;
  return (
    <FormShell title={`Editar ${materia.nombre}`} backHref="/dashboard/materias">
      <MateriaForm action={updateMateria.bind(null, id)} value={materia} />
    </FormShell>
  );
}
