import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { SBadge, RowLink, RowButton, RowActions } from "@/components/entities/ui";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contains, firstParam } from "@/lib/entities";
import { togglePeriodo } from "@/app/dashboard/periodos/actions";
import type { Database } from "@/types/database";

type Periodo = Database["public"]["Tables"]["periodos"]["Row"];

export default async function PeriodosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRol("coordinador", "administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const supabase = await createClient();
  const { data } = await supabase.from("periodos").select("*").order("fecha_inicio", { ascending: false });
  const rows = ((data ?? []) as unknown as Periodo[]).filter((row) => contains(row.nombre, q));

  const columns: TableColumn<Periodo>[] = [
    { key: "nombre", header: "Periodo", cell: (row) => <span className="font-medium">{row.nombre}</span> },
    { key: "inicio", header: "Inicio", cell: (row) => row.fecha_inicio },
    { key: "fin", header: "Fin", cell: (row) => row.fecha_fin },
    { key: "estado", header: "Estado", cell: (row) => <SBadge activo={row.activo} labelOff="Cerrado" /> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <RowActions>
          <RowLink href={`/dashboard/periodos/${row.id}`}>Editar</RowLink>
          <form action={togglePeriodo.bind(null, row.id, !row.activo)}>
            <RowButton type="submit">{row.activo ? "Cerrar" : "Activar"}</RowButton>
          </form>
        </RowActions>
      ),
    },
  ];

  return (
    <DataTable
      title="Periodos académicos"
      description="Crea, activa o cierra periodos. Al activar uno, los demás se cierran automáticamente."
      createHref="/dashboard/periodos/nuevo"
      rows={rows}
      columns={columns}
      searchDefault={q}
    />
  );
}
