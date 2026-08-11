import { redirect } from "next/navigation";
import { getSession, requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SesionReporte = {
  docente_id: string;
  espacio_id: string | null;
  grupo_id: string;
  hora_inicio: string;
  hora_fin: string;
  docentes: { perfiles: { nombre: string } | null } | null;
  espacios: { nombre: string } | null;
  grupos: { nombre: string } | null;
};

function duracionHoras(inicio: string, fin: string) {
  const [horaInicio, minutoInicio] = inicio.slice(0, 5).split(":").map(Number);
  const [horaFin, minutoFin] = fin.slice(0, 5).split(":").map(Number);
  return (horaFin * 60 + minutoFin - horaInicio * 60 - minutoInicio) / 60;
}

export default async function ReportesPage() {
  const { perfil } = await getSession();
  if (perfil?.rol === "docente" || perfil?.rol === "estudiante") redirect("/api/pdf/mi-horario");
  await requireRol("coordinador", "administrador");

  const supabase = await createClient();
  const { data: periodo } = await supabase.from("periodos").select("id,nombre").eq("activo", true).maybeSingle();
  if (!periodo) return <EmptyReport message="No hay un período académico activo para generar reportes." />;

  const { data: horarios } = await supabase
    .from("horarios")
    .select("id,estado,generado_en")
    .eq("periodo_id", periodo.id)
    .order("generado_en", { ascending: false })
    .limit(1);
  const horario = horarios?.[0];
  if (!horario) return <EmptyReport message={`No existe un horario para el período ${periodo.nombre}.`} />;

  const { data } = await supabase
    .from("sesiones")
    .select("docente_id,espacio_id,grupo_id,hora_inicio,hora_fin,docentes:docente_id(perfiles(nombre)),espacios:espacio_id(nombre),grupos:grupo_id(nombre)")
    .eq("horario_id", horario.id);
  const sesiones = (data ?? []) as unknown as SesionReporte[];

  const cargaDocente = new Map<string, { nombre: string; horas: number; clases: number }>();
  const ocupacionAulas = new Map<string, { nombre: string; horas: number; clases: number }>();
  const cargaCursos = new Map<string, { nombre: string; horas: number; clases: number }>();
  for (const sesion of sesiones) {
    const horas = duracionHoras(sesion.hora_inicio, sesion.hora_fin);
    const docente = cargaDocente.get(sesion.docente_id) ?? { nombre: sesion.docentes?.perfiles?.nombre ?? "Docente sin nombre", horas: 0, clases: 0 };
    docente.horas += horas;
    docente.clases += 1;
    cargaDocente.set(sesion.docente_id, docente);
    const curso = cargaCursos.get(sesion.grupo_id) ?? { nombre: sesion.grupos?.nombre ?? "Curso sin nombre", horas: 0, clases: 0 };
    curso.horas += horas;
    curso.clases += 1;
    cargaCursos.set(sesion.grupo_id, curso);
    if (sesion.espacio_id) {
      const aula = ocupacionAulas.get(sesion.espacio_id) ?? { nombre: sesion.espacios?.nombre ?? "Aula sin nombre", horas: 0, clases: 0 };
      aula.horas += horas;
      aula.clases += 1;
      ocupacionAulas.set(sesion.espacio_id, aula);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="border-b border-[#D8D1BD] pb-5">
        <p className="s-eyebrow">Reportes académicos</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0E1116]">Indicadores del horario</h1>
        <p className="mt-1 text-sm text-[#4A515E]">Período {periodo.nombre} · Horario {horario.estado}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sesiones programadas" value={sesiones.length} />
        <Metric label="Cursos con horario configurado" value={cargaCursos.size} />
        <Metric label="Docentes con carga" value={cargaDocente.size} />
        <Metric label="Aulas ocupadas" value={ocupacionAulas.size} />
      </div>
      <section className="grid gap-6 lg:grid-cols-2">
        <ReportTable title="Horarios por curso" subtitle="Cursos configurados, horas semanales y clases asignadas" rows={[...cargaCursos.values()].sort((a, b) => b.horas - a.horas || a.nombre.localeCompare(b.nombre, "es"))} />
        <ReportTable title="Carga docente" subtitle="Horas semanales y clases asignadas" rows={[...cargaDocente.values()].sort((a, b) => b.horas - a.horas)} />
        <ReportTable title="Ocupación de aulas" subtitle="Uso del aula en el horario actual" rows={[...ocupacionAulas.values()].sort((a, b) => b.horas - a.horas)} />
      </section>
      <section className="rounded-xl border border-[#B9E6D2] bg-[#F1FBF6] p-5 text-sm text-[#17603E]">
        <p className="font-semibold">Conflictos detectados</p>
        <p className="mt-1">Los horarios solo pueden publicarse cuando no tienen conflictos críticos. Usa el Editor Manual para revisar las validaciones en tiempo real.</p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-[#D8D1BD] bg-white p-5"><p className="text-3xl font-bold text-[#0E1116]">{value}</p><p className="mt-1 text-sm text-[#4A515E]">{label}</p></div>;
}

function ReportTable({ title, subtitle, rows }: { title: string; subtitle: string; rows: { nombre: string; horas: number; clases: number }[] }) {
  return <section className="overflow-hidden rounded-xl border border-[#D8D1BD] bg-white"><div className="border-b border-[#E5DFCC] p-5"><h2 className="font-semibold text-[#0E1116]">{title}</h2><p className="mt-1 text-sm text-[#4A515E]">{subtitle}</p></div><table className="w-full text-sm"><thead className="bg-[#F5F1E8] text-left text-[#4A515E]"><tr><th className="px-5 py-3 font-medium">Nombre</th><th className="px-5 py-3 text-right font-medium">Horas</th><th className="px-5 py-3 text-right font-medium">Clases</th></tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${row.nombre}-${index}`} className="border-t border-[#E5DFCC]"><td className="px-5 py-3 font-medium text-[#1F242D]">{row.nombre}</td><td className="px-5 py-3 text-right">{row.horas}</td><td className="px-5 py-3 text-right">{row.clases}</td></tr>) : <tr><td colSpan={3} className="px-5 py-8 text-center text-[#727984]">Sin datos para este horario.</td></tr>}</tbody></table></section>;
}

function EmptyReport({ message }: { message: string }) {
  return <div className="rounded-xl border border-[#D8D1BD] bg-white p-10 text-center text-[#4A515E]">{message}</div>;
}
