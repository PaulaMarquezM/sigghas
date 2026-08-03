/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eliminarAsignacionDocente, guardarDisponibilidadEspacio } from "./actions";
import { AsignacionDocenteForm } from "./AsignacionDocenteForm";
import { DisponibilidadEspacioRow } from "./DisponibilidadEspacioRow";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function ConfiguracionHorarioPage() {
  await requireRol("coordinador");
  const supabase = await createClient();
  const [periodos, materias, grupos, docentes, espacios, asignaciones, disponibilidad] = await Promise.all([
    supabase.from("periodos").select("id, nombre").eq("activo", true),
    supabase.from("materias").select("id, codigo, nombre, semestre").eq("activo", true).order("nombre"),
    supabase.from("grupos").select("id, nombre, semestre").eq("activo", true).order("nombre"),
    supabase.from("docentes").select("id, perfiles(nombre)").order("id"),
    supabase.from("espacios").select("id, nombre").eq("activo", true).order("nombre"),
    (supabase as any).from("asignaciones_docente_periodo").select("*, materias(nombre), grupos(nombre), docentes(perfiles(nombre))"),
    (supabase as any).from("disponibilidad_espacio").select("*, espacios(nombre)").order("dia_semana").order("hora_inicio"),
  ]);
  const periodo = periodos.data?.[0];

  return <div className="max-w-5xl space-y-8">
    <div><h1 className="text-3xl font-semibold tracking-tight">Preparar horario</h1><p className="text-base text-gray-600 mt-2">Completa estos dos pasos antes de generar o editar un horario.</p></div>
    {!periodo ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Activa un período académico para configurar sus asignaciones.</div> : <section className="rounded-xl border bg-white p-5 space-y-5">
      <div><span className="font-mono text-xs uppercase tracking-wider text-[#1D3FD9]">Paso 1</span><h2 className="mt-1 text-lg font-semibold">Asignar docente a materia y curso</h2><p className="text-sm text-gray-600">Primero elige el semestre; luego verás únicamente las materias y cursos correspondientes.</p></div>
      <AsignacionDocenteForm periodoId={periodo.id} materias={(materias.data ?? []).map((m) => ({ id: m.id, nombre: m.nombre, semestre: m.semestre }))} cursos={(grupos.data ?? []).map((g) => ({ id: g.id, nombre: g.nombre, semestre: g.semestre }))} docentes={(docentes.data as any[] ?? []).map((d) => ({ id: d.id, nombre: d.perfiles?.nombre ?? "Docente sin nombre" }))} />
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="py-2">Materia</th><th>Curso</th><th>Docente</th><th /></tr></thead><tbody>{(asignaciones.data as any[] ?? []).map((a) => <tr key={`${a.periodo_id}:${a.materia_id}:${a.grupo_id}`} className="border-t"><td className="py-2">{a.materias?.nombre}</td><td>{a.grupos?.nombre}</td><td>{a.docentes?.perfiles?.nombre}</td><td className="text-right"><form action={eliminarAsignacionDocente.bind(null, a.periodo_id, a.materia_id, a.grupo_id)}><button className="font-medium text-[#B33A2B]">Quitar</button></form></td></tr>)}</tbody></table></div>
    </section>}
    <section className="rounded-xl border bg-white p-5 space-y-5">
      <div><span className="font-mono text-xs uppercase tracking-wider text-[#1D3FD9]">Paso 2</span><h2 className="mt-1 text-lg font-semibold">Disponibilidad de aulas</h2><p className="text-sm text-gray-600">Las aulas nuevas quedan disponibles de lunes a viernes, de 08:00 a 17:00. Aquí puedes editar excepciones.</p></div>
      <form action={guardarDisponibilidadEspacio} className="grid gap-3 md:grid-cols-5 items-end">
        <label className="grid gap-1 text-sm">Aula *<select name="espacio_id" required className="min-w-0 rounded-lg border p-2.5">{espacios.data?.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
        <label className="grid gap-1 text-sm">Día *<select name="dia_semana" className="min-w-0 rounded-lg border p-2.5">{DIAS.slice(0, 5).map((dia, index) => <option key={dia} value={index + 1}>{dia}</option>)}</select></label>
        <label className="grid gap-1 text-sm">Desde *<input name="hora_inicio" type="time" min="08:00" max="17:00" step="1800" defaultValue="08:00" required className="rounded-lg border p-2.5" /></label>
        <label className="grid gap-1 text-sm">Hasta *<input name="hora_fin" type="time" min="08:00" max="17:00" step="1800" defaultValue="17:00" required className="rounded-lg border p-2.5" /></label>
        <div><label className="mb-2 flex gap-2 text-sm"><input name="disponible" type="checkbox" defaultChecked /> Disponible</label><button className="rounded-lg bg-[#1D3FD9] px-4 py-2.5 text-sm font-semibold text-white">Guardar franja</button></div>
      </form>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="py-2">Aula</th><th>Día</th><th>Franja</th><th>Estado</th><th /></tr></thead><tbody>{(disponibilidad.data as any[] ?? []).map((b) => <DisponibilidadEspacioRow key={b.id} row={{ id: b.id, espacioNombre: b.espacios?.nombre ?? "", dia_semana: b.dia_semana, hora_inicio: b.hora_inicio, hora_fin: b.hora_fin, disponible: b.disponible }} />)}</tbody></table></div>
    </section>
  </div>;
}
