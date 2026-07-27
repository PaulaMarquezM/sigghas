import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contains, firstParam } from "@/lib/entities";
import type { Database } from "@/types/database";

type Sede = Database["public"]["Tables"]["sedes"]["Row"];

export default async function SedesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRol("administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const supabase = await createClient();
  const { data } = await supabase.from("sedes").select("*").order("nombre");

  const rows = ((data ?? []) as Sede[]).filter((row) => contains(row.nombre, q));

  const columns: TableColumn<Sede>[] = [
    { key: "nombre", header: "Sede", cell: (row) => <span className="font-medium">{row.nombre}</span> },
    { key: "tipo", header: "Tipo", cell: (row) => <Badge variant={row.es_central ? "secondary" : "outline"}>{row.es_central ? "Central" : "Sede"}</Badge> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/sedes/${row.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Editar</Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="Sedes"
      description="Gestiona las sedes de la carrera (Portoviejo, Manta, y las que se agreguen)."
      createHref="/dashboard/sedes/nuevo"
      rows={rows}
      columns={columns}
      searchDefault={q}
    />
  );
}
