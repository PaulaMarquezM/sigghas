import { EspacioForm } from "@/components/entities/EspacioForm";
import { FormShell } from "@/components/entities/FormShell";
import { createEspacio } from "@/app/dashboard/espacios/actions";
import { getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";

export default async function NuevoEspacioPage() {
  await requireRol("coordinador", "administrador");
  const sedes = await getSedes();
  return (
    <FormShell title="Nuevo espacio" backHref="/dashboard/espacios">
      <EspacioForm action={createEspacio} sedes={sedes} />
    </FormShell>
  );
}
