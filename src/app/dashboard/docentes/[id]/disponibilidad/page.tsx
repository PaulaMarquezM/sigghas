import { notFound } from "next/navigation";
import { DisponibilidadGrid } from "@/components/entities/DisponibilidadGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { expandirBloquesDisponibilidad } from "@/lib/disponibilidad";
import type { Database } from "@/types/database";
import { asUntypedDb } from "@/lib/entities";

type Disponibilidad = Database["public"]["Tables"]["disponibilidad_docente"]["Row"];
type DocenteHeader = { id: string; perfiles: { nombre: string; email: string } | null };

export default async function DisponibilidadDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("coordinador", "administrador", "docente");
  const { id } = await params;
  const supabase = await createClient();
  const db = asUntypedDb(supabase);
  const [{ data: docente }, { data: disponibilidad }] = await Promise.all([
    db.from("docentes").select("id, perfiles(nombre,email)").eq("id", id).single(),
    db.from("disponibilidad_docente").select("*").eq("docente_id", id),
  ]);

  if (!docente) notFound();

  const selected = expandirBloquesDisponibilidad(
    ((disponibilidad ?? []) as Disponibilidad[])
      .filter((row) => !row.es_tiempo_oficina)
      .map((row) => ({ dia_semana: row.dia_semana, hora_inicio: row.hora_inicio, hora_fin: row.hora_fin }))
  );
  const perfil = (docente as unknown as DocenteHeader).perfiles;

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Disponibilidad docente</h1>
        <p className="text-sm text-gray-500">{perfil?.nombre} · Bloques de 30 minutos, lunes a sábado de 08:00 a 17:00.</p>
      </div>
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Bloques disponibles</CardTitle></CardHeader>
        <CardContent>
          <DisponibilidadGrid docenteId={id} selected={selected} />
        </CardContent>
      </Card>
    </div>
  );
}
