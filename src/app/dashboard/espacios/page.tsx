import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { NativeSelect } from "@/components/entities/FormShell";
import { SBadge, RowLink, RowButton, RowActions } from "@/components/entities/ui";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contains, firstParam, getSedes } from "@/lib/entities";
import { toggleEspacio } from "@/app/dashboard/espacios/actions";
import type { Database } from "@/types/database";

type Espacio = Database["public"]["Tables"]["espacios"]["Row"] & { sedes: { nombre: string } | null };

export default async function EspaciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sede?: string; tipo?: string; estado?: string }>;
}) {
  await requireRol("coordinador", "administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const sede = firstParam(params.sede);
  const tipo = firstParam(params.tipo);
  const estado = firstParam(params.estado);
  const supabase = await createClient();
  const sedes = await getSedes();
  const { data } = await supabase.from("espacios").select("*, sedes(nombre)").order("nombre");

  const rows = ((data ?? []) as unknown as Espacio[]).filter((row) => (
    contains(row.nombre, q) &&
    (!sede || row.sede_id === sede) &&
    (!tipo || row.tipo === tipo) &&
    (!estado || (row.activo ? "disponible" : "inactivo") === estado)
  ));

  const columns: TableColumn<Espacio>[] = [
    { key: "nombre", header: "Espacio", cell: (row) => <span className="font-medium">{row.nombre}</span> },
    { key: "tipo", header: "Tipo", cell: (row) => row.tipo.replace("_", " ") },
    { key: "capacidad", header: "Capacidad", cell: (row) => row.capacidad },
    { key: "sede", header: "Sede", cell: (row) => row.sedes?.nombre ?? "Sin sede" },
    { key: "estado", header: "Estado", cell: (row) => <SBadge activo={row.activo} /> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <RowActions>
          <RowLink href={`/dashboard/espacios/${row.id}`}>Editar</RowLink>
          <form action={toggleEspacio.bind(null, row.id, !row.activo)}>
            <RowButton type="submit">{row.activo ? "Desactivar" : "Reactivar"}</RowButton>
          </form>
        </RowActions>
      ),
    },
  ];

  return (
    <DataTable
      title="Aulas y laboratorios"
      description="Gestiona espacios físicos, capacidad, sede y disponibilidad."
      createHref="/dashboard/espacios/nuevo"
      rows={rows}
      columns={columns}
      searchDefault={q}
      filters={
        <>
          <NativeSelect id="sede" name="sede" defaultValue={sede}>
            <option value="">Todas las sedes</option>
            {sedes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </NativeSelect>
          <NativeSelect id="tipo" name="tipo" defaultValue={tipo}>
            <option value="">Todos los tipos</option>
            <option value="aula">Aula</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="sala_reuniones">Sala de reuniones</option>
            <option value="auditorio">Auditorio</option>
          </NativeSelect>
          <NativeSelect id="estado" name="estado" defaultValue={estado}>
            <option value="">Todos los estados</option>
            <option value="disponible">Disponibles</option>
            <option value="inactivo">Inactivos</option>
          </NativeSelect>
        </>
      }
    />
  );
}
