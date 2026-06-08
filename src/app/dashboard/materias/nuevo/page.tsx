import { MateriaForm } from "@/components/entities/MateriaForm";
import { FormShell } from "@/components/entities/FormShell";
import { createMateria } from "@/app/dashboard/materias/actions";
import { requireRol } from "@/lib/auth";

export default async function NuevaMateriaPage() {
  await requireRol("coordinador", "administrador");
  return (
    <FormShell title="Nueva materia" backHref="/dashboard/materias">
      <MateriaForm action={createMateria} />
    </FormShell>
  );
}
