import { GrupoForm } from "@/components/entities/GrupoForm";
import { FormShell } from "@/components/entities/FormShell";
import { createGrupo } from "@/app/dashboard/grupos/actions";
import { getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";

export default async function NuevoGrupoPage() {
  await requireRol("coordinador", "administrador");
  const sedes = await getSedes();
  return (
    <FormShell title="Nuevo grupo" backHref="/dashboard/grupos">
      <GrupoForm action={createGrupo} sedes={sedes} />
    </FormShell>
  );
}
