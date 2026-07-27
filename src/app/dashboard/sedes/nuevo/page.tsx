import { SedeForm } from "@/components/entities/SedeForm";
import { FormShell } from "@/components/entities/FormShell";
import { createSede } from "@/app/dashboard/sedes/actions";
import { requireRol } from "@/lib/auth";

export default async function NuevaSedePage() {
  await requireRol("administrador");
  return (
    <FormShell title="Nueva sede" backHref="/dashboard/sedes">
      <SedeForm action={createSede} />
    </FormShell>
  );
}
