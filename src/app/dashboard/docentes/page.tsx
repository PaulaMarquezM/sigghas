import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { NativeSelect } from "@/components/entities/FormShell";
import { requireRolAndAdminClient } from "@/lib/supabase/admin";
import { contains, firstParam, getSedes } from "@/lib/entities";
import { toggleDocente } from "@/app/dashboard/docentes/actions";
import type { Database } from "@/types/database";

type DocenteRow = Database["public"]["Tables"]["docentes"]["Row"] & {
  perfiles: { nombre: string; email: string; activo: boolean } | null;
  sedes: { nombre: string } | null;
  docente_sedes: { sede_id: string; sedes: { nombre: string } | null }[] | null;
};

export default async function DocentesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sede?: string; contrato?: string; estado?: string }>;
}) {
  const { admin: supabase } = await requireRolAndAdminClient("coordinador", "administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const sede = firstParam(params.sede);
  const contrato = firstParam(params.contrato);
  const estado = firstParam(params.estado);
  const sedes = await getSedes();

  const { data, error } = await supabase
    .from("docentes")
    .select("*, perfiles(nombre,email,activo), sedes:sede_principal_id(nombre), docente_sedes(sede_id, sedes(nombre))")
    .order("max_horas_semana", { ascending: false });

  if (error) notFound();

  const rows = ((data ?? []) as unknown as DocenteRow[]).filter((row) => {
    const active = row.perfiles?.activo ? "activo" : "inactivo";
    return (
      contains(row.perfiles?.nombre, q) &&
      (!sede || row.sede_principal_id === sede || row.docente_sedes?.some((item) => item.sede_id === sede)) &&
      (!contrato || row.tipo_contrato === contrato) &&
      (!estado || active === estado)
    );
  });

  const columns: TableColumn<DocenteRow>[] = [
    { key: "nombre", header: "Docente", cell: (row) => <div><p className="font-medium">{row.perfiles?.nombre}</p><p className="text-xs text-gray-500">{row.perfiles?.email}</p></div> },
    { key: "contrato", header: "Contrato", cell: (row) => row.tipo_contrato === "tiempo_completo" ? "Tiempo completo" : "Por horas" },
    { key: "horas", header: "Horas max.", cell: (row) => row.max_horas_semana },
    { key: "sede", header: "Sedes", cell: (row) => row.docente_sedes?.map((item) => item.sedes?.nombre).filter(Boolean).join(", ") || row.sedes?.nombre || "Sin sede" },
    { key: "estado", header: "Estado", cell: (row) => <Badge variant={row.perfiles?.activo ? "secondary" : "outline"}>{row.perfiles?.activo ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/docentes/${row.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Editar</Link>
          <Link href={`/dashboard/docentes/${row.id}/disponibilidad`} className={buttonVariants({ size: "sm", variant: "outline" })}>Disponibilidad</Link>
          <form action={toggleDocente.bind(null, row.id, !(row.perfiles?.activo ?? false))}>
            <Button size="sm" variant="ghost" type="submit">{row.perfiles?.activo ? "Desactivar" : "Reactivar"}</Button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="Docentes"
      description="Gestiona contratos, carga horaria, sedes y disponibilidad docente."
      createHref="/dashboard/docentes/nuevo"
      rows={rows}
      columns={columns}
      searchDefault={q}
      filters={
        <>
          <NativeSelect id="sede" name="sede" defaultValue={sede}>
            <option value="">Todas las sedes</option>
            {sedes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </NativeSelect>
          <NativeSelect id="contrato" name="contrato" defaultValue={contrato}>
            <option value="">Todos los contratos</option>
            <option value="tiempo_completo">Tiempo completo</option>
            <option value="por_horas">Por horas</option>
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
