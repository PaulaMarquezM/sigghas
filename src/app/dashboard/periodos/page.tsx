import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableColumn } from "@/components/entities/DataTable";
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
    { key: "estado", header: "Estado", cell: (row) => <Badge variant={row.activo ? "secondary" : "outline"}>{row.activo ? "Activo" : "Cerrado"}</Badge> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/periodos/${row.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Editar</Link>
          <form action={togglePeriodo.bind(null, row.id, !row.activo)}>
            <Button size="sm" variant="ghost" type="submit">{row.activo ? "Cerrar" : "Activar"}</Button>
          </form>
        </div>
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
