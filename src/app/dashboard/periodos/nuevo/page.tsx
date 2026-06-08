import { PeriodoForm } from "@/components/entities/PeriodoForm";
import { FormShell } from "@/components/entities/FormShell";
import { createPeriodo } from "@/app/dashboard/periodos/actions";
import { requireRol } from "@/lib/auth";

export default async function NuevoPeriodoPage() {
  await requireRol("coordinador", "administrador");
  return (
    <FormShell title="Nuevo periodo" backHref="/dashboard/periodos">
      <PeriodoForm action={createPeriodo} />
    </FormShell>
  );
}
