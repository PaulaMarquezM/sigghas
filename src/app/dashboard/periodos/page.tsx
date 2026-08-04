import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { SBadge, RowLink, RowButton, RowActions } from "@/components/entities/ui";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contains, firstParam } from "@/lib/entities";
import { togglePeriodo } from "@/app/dashboard/periodos/actions";
import type { Database } from "@/types/database";

type Periodo = Database["public"]["Tables"]["periodos"]["Row"];

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

export default async function PeriodosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRol("coordinador", "administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const supabase = await createClient();
  const { data } = await supabase.from("periodos").select("*").order("fecha_inicio", { ascending: false });
  const rows = ((data ?? []) as unknown as Periodo[]).filter((row) => contains(row.nombre, q));
  const periodoActivo = rows.find((row) => row.activo);

  const columns: TableColumn<Periodo>[] = [
    {
      key: "nombre", header: "Periodo", cell: (row) => (
        <div>
          <p className="font-medium">{row.nombre}</p>
          {row.activo && <p className="mt-0.5 text-xs font-medium text-emerald-700">Seleccionado actualmente</p>}
        </div>
      ),
    },
    { key: "vigencia", header: "Vigencia", cell: (row) => <span className="text-sm text-gray-700">{formatFecha(row.fecha_inicio)} — {formatFecha(row.fecha_fin)}</span> },
    { key: "estado", header: "Estado", cell: (row) => <SBadge activo={row.activo} labelOff="Cerrado" /> },
    {
      key: "actions", header: "", cell: (row) => (
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
    <div className="space-y-5">
      <section className={`rounded-xl border p-4 ${periodoActivo ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`} aria-live="polite">
        {periodoActivo ? <>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Periodo seleccionado para la operación actual</p>
          <p className="mt-1 text-lg font-semibold text-emerald-950">{periodoActivo.nombre}</p>
          <p className="text-sm text-emerald-800">Del {formatFecha(periodoActivo.fecha_inicio)} al {formatFecha(periodoActivo.fecha_fin)}. La generación, matrícula y consulta toman este período.</p>
        </> : <>
          <p className="font-semibold text-amber-950">No hay un período activo seleccionado.</p>
          <p className="text-sm text-amber-800">Activa uno para generar horarios, registrar matrículas y consultar el período actual.</p>
        </>}
      </section>
      <DataTable
        title="Periodos académicos"
        description="Revisa el nombre, vigencia y estado antes de activar un período. Al activar uno, los demás se cierran automáticamente."
        createHref="/dashboard/periodos/nuevo"
        rows={rows}
        columns={columns}
        searchDefault={q}
      />
    </div>
  );
}
