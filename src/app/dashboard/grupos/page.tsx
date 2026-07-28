import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { NativeSelect } from "@/components/entities/FormShell";
import { SBadge, RowLink, RowButton, RowActions } from "@/components/entities/ui";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contains, firstParam, getSedes } from "@/lib/entities";
import { toggleGrupo } from "@/app/dashboard/grupos/actions";
import type { Database } from "@/types/database";

type Grupo = Database["public"]["Tables"]["grupos"]["Row"] & { sedes: { nombre: string } | null };

export default async function GruposPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sede?: string; semestre?: string; estado?: string }>;
}) {
  await requireRol("coordinador", "administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const sede = firstParam(params.sede);
  const semestre = firstParam(params.semestre);
  const estado = firstParam(params.estado);
  const supabase = await createClient();
  const sedes = await getSedes();
  const { data } = await supabase.from("grupos").select("*, sedes(nombre)").order("semestre").order("nombre");

  const rows = ((data ?? []) as unknown as Grupo[]).filter((row) => (
    contains(row.nombre, q) &&
    (!sede || row.sede_id === sede) &&
    (!semestre || String(row.semestre) === semestre) &&
    (!estado || (row.activo ? "activo" : "inactivo") === estado)
  ));

  const columns: TableColumn<Grupo>[] = [
    { key: "nombre", header: "Curso", cell: (row) => <span className="font-medium">{row.nombre}</span> },
    { key: "semestre", header: "Semestre", cell: (row) => row.semestre },
    { key: "estudiantes", header: "Estudiantes", cell: (row) => row.cantidad_estudiantes },
    { key: "sede", header: "Sede", cell: (row) => row.sedes?.nombre ?? "Sin sede" },
    { key: "estado", header: "Estado", cell: (row) => <SBadge activo={row.activo} labelOff="Archivado" /> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <RowActions>
          <RowLink href={`/dashboard/grupos/${row.id}`}>Editar</RowLink>
          <form action={toggleGrupo.bind(null, row.id, !row.activo)}>
            <RowButton type="submit">{row.activo ? "Archivar" : "Reactivar"}</RowButton>
          </form>
        </RowActions>
      ),
    },
  ];

  return (
    <DataTable
      title="Cursos"
      description="Gestiona cursos por semestre, sede y cantidad de estudiantes."
      createHref="/dashboard/grupos/nuevo"
      rows={rows}
      columns={columns}
      searchDefault={q}
      filters={
        <>
          <NativeSelect id="sede" name="sede" defaultValue={sede}>
            <option value="">Todas las sedes</option>
            {sedes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </NativeSelect>
          <NativeSelect id="semestre" name="semestre" defaultValue={semestre}>
            <option value="">Todos los semestres</option>
            {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </NativeSelect>
          <NativeSelect id="estado" name="estado" defaultValue={estado}>
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Archivados</option>
          </NativeSelect>
        </>
      }
    />
  );
}
