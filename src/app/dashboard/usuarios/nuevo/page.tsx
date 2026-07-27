import Link from "next/link";
import { UsuarioForm } from "@/components/entities/UsuarioForm";
import { FormShell } from "@/components/entities/FormShell";
import { createUsuario } from "@/app/dashboard/usuarios/actions";
import { getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";

export default async function NuevoUsuarioPage() {
  await requireRol("administrador");
  const sedes = await getSedes();
  return (
    <FormShell title="Nuevo usuario" backHref="/dashboard/usuarios">
      <p className="mb-4 text-sm text-gray-500">
        Para crear un docente usa la sección{" "}
        <Link href="/dashboard/docentes/nuevo" className="underline">Docentes</Link>{" "}
        (necesita datos adicionales de contrato y disponibilidad).
      </p>
      <UsuarioForm action={createUsuario} sedes={sedes} />
    </FormShell>
  );
}
