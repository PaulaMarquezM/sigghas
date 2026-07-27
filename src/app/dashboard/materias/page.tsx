import { DataTable, type TableColumn } from "@/components/entities/DataTable";
import { NativeSelect } from "@/components/entities/FormShell";
import { SBadge, RowLink, RowButton, RowActions } from "@/components/entities/ui";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contains, firstParam } from "@/lib/entities";
import { toggleMateria } from "@/app/dashboard/materias/actions";
import type { Database } from "@/types/database";

type Materia = Database["public"]["Tables"]["materias"]["Row"];

export default async function MateriasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; nivel?: string; laboratorio?: string; estado?: string }>;
}) {
  await requireRol("coordinador", "administrador");
  const params = await searchParams;
  const q = firstParam(params.q);
  const nivel = firstParam(params.nivel);
  const laboratorio = firstParam(params.laboratorio);
  const estado = firstParam(params.estado);
  const supabase = await createClient();
  const { data } = await supabase.from("materias").select("*").order("nivel").order("nombre");

  const rows = ((data ?? []) as unknown as Materia[]).filter((row) => (
    (contains(row.nombre, q) || contains(row.codigo, q)) &&
    (!nivel || String(row.nivel) === nivel) &&
    (!laboratorio || String(row.requiere_laboratorio) === laboratorio) &&
    (!estado || (row.activo ? "activo" : "inactivo") === estado)
  ));

  const columns: TableColumn<Materia>[] = [
    { key: "codigo", header: "Código", cell: (row) => <span className="font-medium">{row.codigo}</span> },
    { key: "nombre", header: "Materia", cell: (row) => row.nombre },
    { key: "nivel", header: "Nivel", cell: (row) => row.nivel },
    { key: "horas", header: "Horas", cell: (row) => `${row.horas_teoria}T / ${row.horas_practica}P` },
    { key: "modalidad", header: "Modalidad", cell: (row) => row.modalidad },
    { key: "estado", header: "Estado", cell: (row) => <SBadge activo={row.activo} labelOn="Activa" labelOff="Inactiva" /> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <RowActions>
          <RowLink href={`/dashboard/materias/${row.id}`}>Editar</RowLink>
          <form action={toggleMateria.bind(null, row.id, !row.activo)}>
            <RowButton type="submit">{row.activo ? "Desactivar" : "Reactivar"}</RowButton>
          </form>
        </RowActions>
      ),
    },
  ];

  return (
    <DataTable
      title="Materias"
      description="Administra materias, semestre, horas semanales y necesidad de laboratorio."
      createHref="/dashboard/materias/nuevo"
      rows={rows}
      columns={columns}
      searchDefault={q}
      filters={
        <>
          <NativeSelect id="nivel" name="nivel" defaultValue={nivel}>
            <option value="">Todos los niveles</option>
            {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </NativeSelect>
          <NativeSelect id="laboratorio" name="laboratorio" defaultValue={laboratorio}>
            <option value="">Todos</option>
            <option value="true">Con laboratorio</option>
            <option value="false">Sin laboratorio</option>
          </NativeSelect>
          <NativeSelect id="estado" name="estado" defaultValue={estado}>
            <option value="">Todos los estados</option>
            <option value="activo">Activas</option>
            <option value="inactivo">Inactivas</option>
          </NativeSelect>
        </>
      }
    />
  );
}
