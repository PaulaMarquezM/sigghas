import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { NativeSelect } from "@/components/entities/FormShell";
import { requireRol, LABEL_ROL } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contains, firstParam, getSedes } from "@/lib/entities";
import { toggleUsuario } from "@/app/dashboard/usuarios/actions";
import type { Database } from "@/types/database";

type Usuario = Database["public"]["Tables"]["perfiles"]["Row"] & { sedes: { nombre: string } | null };

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string; sede?: string; estado?: string }>;
}) {
  await requireRol("administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const rol = firstParam(params.rol);
  const sede = firstParam(params.sede);
  const estado = firstParam(params.estado);
  const supabase = await createClient();
  const sedes = await getSedes();
  const { data } = await supabase.from("perfiles").select("*, sedes(nombre)").order("nombre");

  const rows = ((data ?? []) as unknown as Usuario[]).filter((row) => (
    contains(row.nombre, q) &&
    (!rol || row.rol === rol) &&
    (!sede || row.sede_id === sede) &&
    (!estado || (row.activo ? "activo" : "inactivo") === estado)
  ));

  const columns: TableColumn<Usuario>[] = [
    { key: "nombre", header: "Nombre", cell: (row) => <div><p className="font-medium">{row.nombre}</p><p className="text-xs text-gray-500">{row.email}</p></div> },
    { key: "rol", header: "Rol", cell: (row) => <Badge variant="outline">{LABEL_ROL[row.rol]}</Badge> },
    { key: "sede", header: "Sede", cell: (row) => row.sedes?.nombre ?? "Sin sede" },
    { key: "estado", header: "Estado", cell: (row) => <Badge variant={row.activo ? "secondary" : "outline"}>{row.activo ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Link
            href={row.rol === "docente" ? `/dashboard/docentes/${row.id}` : `/dashboard/usuarios/${row.id}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Editar
          </Link>
          <form action={toggleUsuario.bind(null, row.id, !row.activo)}>
            <Button size="sm" variant="ghost" type="submit">{row.activo ? "Desactivar" : "Reactivar"}</Button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="Usuarios"
      description="Gestiona los roles, sede y estado de todas las cuentas del sistema."
      createHref="/dashboard/usuarios/nuevo"
      rows={rows}
      columns={columns}
      searchDefault={q}
      emptyText="No hay usuarios que coincidan con el filtro."
      filters={
        <>
          <NativeSelect id="rol" name="rol" defaultValue={rol}>
            <option value="">Todos los roles</option>
            <option value="coordinador">Coordinador</option>
            <option value="docente">Docente</option>
            <option value="administrador">Administrador</option>
            <option value="apoyo">Personal de apoyo</option>
          </NativeSelect>
          <NativeSelect id="sede" name="sede" defaultValue={sede}>
            <option value="">Todas las sedes</option>
            {sedes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </NativeSelect>
          <NativeSelect id="estado" name="estado" defaultValue={estado}>
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </NativeSelect>
        </>
      }
    />
  );
}
