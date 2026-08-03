import { requireRolAndAdminClient } from "@/lib/supabase/admin";
import { asUntypedDb } from "@/lib/entities";
import { MatriculasForm } from "./MatriculasForm";

export default async function MatriculasPage() {
  const { admin } = await requireRolAndAdminClient("coordinador", "administrador"); const db = asUntypedDb(admin);
  const [estudiantes, periodos, materias, grupos] = await Promise.all([
    db.from("perfiles").select("id,nombre,email").eq("rol", "estudiante").eq("activo", true).order("nombre"),
    db.from("periodos").select("id,nombre,activo").order("fecha_inicio", { ascending: false }),
    db.from("materias").select("id,nombre").eq("activo", true).order("nombre"),
    db.from("grupos").select("id,nombre").eq("activo", true).order("nombre"),
  ]);
  const activo = (periodos.data ?? []).find((p: { activo?: boolean }) => p.activo) as { id: string } | undefined;
  const { data: horarios } = activo ? await db.from("horarios").select("id").eq("periodo_id", activo.id).eq("estado", "publicado").order("generado_en", { ascending: false }).limit(1) : { data: [] };
  const { data: sesiones } = horarios?.[0] ? await db.from("sesiones").select("materia_id,grupo_id").eq("horario_id", horarios[0].id) : { data: [] };
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Matrículas de estudiantes</h1><p className="text-sm text-gray-500">Selecciona una materia y después verás solo los cursos que sí tienen clase publicada.</p></div><MatriculasForm estudiantes={(estudiantes.data ?? []) as unknown as { id: string; nombre: string; email: string }[]} periodos={(periodos.data ?? []) as unknown as { id: string; nombre: string }[]} materias={(materias.data ?? []) as unknown as { id: string; nombre: string }[]} grupos={(grupos.data ?? []) as unknown as { id: string; nombre: string }[]} opcionesValidas={(sesiones ?? []) as unknown as Array<{ materia_id: string; grupo_id: string }>} /></div>;
}
