import { notFound } from "next/navigation";
import { DocenteForm } from "@/components/entities/DocenteForm";
import { FormShell } from "@/components/entities/FormShell";
import { updateDocente } from "@/app/dashboard/docentes/actions";
import { createClient } from "@/lib/supabase/server";
import { getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";
import type { Database } from "@/types/database";

type DocenteDetail = Database["public"]["Tables"]["docentes"]["Row"] & {
  perfiles: { nombre: string; email: string; activo: boolean } | null;
};

export default async function EditarDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("coordinador", "administrador");
  const { id } = await params;
  const supabase = await createClient();
  const sedes = await getSedes();
  const { data } = await (supabase as any)
    .from("docentes")
    .select("*, perfiles(nombre,email,activo)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const row = data as DocenteDetail;

  return (
    <FormShell title={`Editar ${row.perfiles?.nombre ?? "docente"}`} backHref="/dashboard/docentes">
      <DocenteForm
        action={updateDocente.bind(null, id)}
        sedes={sedes}
        includeIdentityFields={false}
        value={{
          tipo_contrato: row.tipo_contrato,
          max_horas_semana: row.max_horas_semana,
          sede_principal_id: row.sede_principal_id,
          activo: row.perfiles?.activo ?? true,
        }}
      />
    </FormShell>
  );
}
