import { notFound, redirect } from "next/navigation";
import { UsuarioForm } from "@/components/entities/UsuarioForm";
import { FormShell } from "@/components/entities/FormShell";
import { updateUsuario } from "@/app/dashboard/usuarios/actions";
import { createClient } from "@/lib/supabase/server";
import { getSedes } from "@/lib/entities";
import { requireRol } from "@/lib/auth";
import type { Database } from "@/types/database";

type Usuario = Database["public"]["Tables"]["perfiles"]["Row"];

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol("administrador");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, sedes] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", id).single(),
    getSedes(),
  ]);
  if (!data) notFound();
  const usuario = data as Usuario;

  // Los docentes se editan en su propia sección (necesitan tipo_contrato, etc.).
  if (usuario.rol === "docente") {
    redirect(`/dashboard/docentes/${id}`);
  }

  return (
    <FormShell title={`Editar ${usuario.nombre}`} backHref="/dashboard/usuarios">
      <UsuarioForm
        action={updateUsuario.bind(null, id)}
        sedes={sedes}
        includeIdentityFields={false}
        value={{ rol: usuario.rol, sede_id: usuario.sede_id, activo: usuario.activo }}
      />
    </FormShell>
  );
}
