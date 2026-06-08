import { notFound } from "next/navigation";
import { DisponibilidadGrid } from "@/components/entities/DisponibilidadGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

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
  const [{ data: docente }, { data: disponibilidad }] = await Promise.all([
    (supabase as any).from("docentes").select("id, perfiles(nombre,email)").eq("id", id).single(),
    (supabase as any).from("disponibilidad_docente").select("*").eq("docente_id", id),
  ]);

  if (!docente) notFound();

  const selected = new Set(
    ((disponibilidad ?? []) as Disponibilidad[]).map((row) => `${row.dia_semana}-${row.hora_inicio.slice(0, 5)}`)
  );
  const perfil = (docente as DocenteHeader).perfiles;

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Disponibilidad docente</h1>
        <p className="text-sm text-gray-500">{perfil?.nombre} · Bloques de una hora, lunes a viernes de 07:00 a 19:00.</p>
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
