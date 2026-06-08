import { DocenteForm } from "@/components/entities/DocenteForm";
import { FormShell } from "@/components/entities/FormShell";
import { createDocente } from "@/app/dashboard/docentes/actions";
import { getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";

export default async function NuevoDocentePage() {
  await requireRol("coordinador", "administrador");
  const sedes = await getSedes();
  return (
    <FormShell title="Nuevo docente" backHref="/dashboard/docentes">
      <DocenteForm action={createDocente} sedes={sedes} />
    </FormShell>
  );
}
