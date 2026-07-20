/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eliminarAsignacionDocente, eliminarDisponibilidadEspacio, guardarAsignacionDocente, guardarDisponibilidadEspacio } from "./actions";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function ConfiguracionHorarioPage() {
  await requireRol("coordinador");
  const supabase = await createClient();
  const [periodos, materias, grupos, docentes, espacios, asignaciones, disponibilidad] = await Promise.all([
    supabase.from("periodos").select("id, nombre").eq("activo", true),
    supabase.from("materias").select("id, codigo, nombre, semestre").eq("activo", true).order("codigo"),
    supabase.from("grupos").select("id, nombre, semestre").eq("activo", true).order("nombre"),
    supabase.from("docentes").select("id, perfiles(nombre)").order("id"),
    supabase.from("espacios").select("id, nombre").eq("activo", true).order("nombre"),
    (supabase as any).from("asignaciones_docente_periodo").select("*, materias(codigo), grupos(nombre), docentes(perfiles(nombre))"),
    (supabase as any).from("disponibilidad_espacio").select("*, espacios(nombre)").order("dia_semana").order("hora_inicio"),
  ]);
  const periodo = periodos.data?.[0];

  return <div className="max-w-5xl space-y-8">
    <div><h1 className="text-xl font-bold">Configuración del generador</h1><p className="text-sm text-gray-500 mt-1">Estas restricciones se validan antes de crear un borrador.</p></div>
    {!periodo ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Activa un período académico para configurar sus asignaciones.</div> : <section className="rounded-xl border bg-white p-5 space-y-5">
      <div><h2 className="font-semibold">Docente por materia y grupo</h2><p className="text-xs text-gray-500">Cada combinación debe tener exactamente un docente para el período activo.</p></div>
      <form action={guardarAsignacionDocente} className="grid gap-3 md:grid-cols-4 items-end">
        <input type="hidden" name="periodo_id" value={periodo.id} />
        <label className="grid gap-1 text-sm">Materia<select name="materia_id" required className="rounded border p-2">{materias.data?.map((m) => <option key={m.id} value={m.id}>{m.codigo} · {m.nombre} (S{m.semestre})</option>)}</select></label>
        <label className="grid gap-1 text-sm">Grupo<select name="grupo_id" required className="rounded border p-2">{grupos.data?.map((g) => <option key={g.id} value={g.id}>{g.nombre} (S{g.semestre})</option>)}</select></label>
        <label className="grid gap-1 text-sm">Docente<select name="docente_id" required className="rounded border p-2">{(docentes.data as any[] ?? []).map((d) => <option key={d.id} value={d.id}>{d.perfiles?.nombre ?? d.id}</option>)}</select></label>
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">Guardar</button>
      </form>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="py-2">Materia</th><th>Grupo</th><th>Docente</th><th /></tr></thead><tbody>{(asignaciones.data as any[] ?? []).map((a) => <tr key={`${a.periodo_id}:${a.materia_id}:${a.grupo_id}`} className="border-t"><td className="py-2">{a.materias?.codigo}</td><td>{a.grupos?.nombre}</td><td>{a.docentes?.perfiles?.nombre}</td><td className="text-right"><form action={eliminarAsignacionDocente.bind(null, a.periodo_id, a.materia_id, a.grupo_id)}><button className="text-red-700">Quitar</button></form></td></tr>)}</tbody></table></div>
    </section>}
    <section className="rounded-xl border bg-white p-5 space-y-5">
      <div><h2 className="font-semibold">Franja de disponibilidad de espacios</h2><p className="text-xs text-gray-500">Por defecto, un espacio habilitado está disponible. Registra una franja como “no disponible” para bloquearla.</p></div>
      <form action={guardarDisponibilidadEspacio} className="grid gap-3 md:grid-cols-5 items-end">
        <label className="grid gap-1 text-sm">Espacio<select name="espacio_id" required className="rounded border p-2">{espacios.data?.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
        <label className="grid gap-1 text-sm">Día<select name="dia_semana" className="rounded border p-2">{DIAS.map((dia, index) => <option key={dia} value={index + 1}>{dia}</option>)}</select></label>
        <label className="grid gap-1 text-sm">Desde<input name="hora_inicio" type="time" min="08:00" max="17:00" step="1800" required className="rounded border p-2" /></label>
        <label className="grid gap-1 text-sm">Hasta<input name="hora_fin" type="time" min="08:00" max="17:00" step="1800" required className="rounded border p-2" /></label>
        <div><label className="mb-2 flex gap-2 text-sm"><input name="disponible" type="checkbox" /> Disponible</label><button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">Agregar</button></div>
      </form>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="py-2">Espacio</th><th>Día</th><th>Franja</th><th>Estado</th><th /></tr></thead><tbody>{(disponibilidad.data as any[] ?? []).map((b) => <tr key={b.id} className="border-t"><td className="py-2">{b.espacios?.nombre}</td><td>{DIAS[b.dia_semana - 1]}</td><td>{b.hora_inicio?.slice(0, 5)}–{b.hora_fin?.slice(0, 5)}</td><td>{b.disponible ? "Disponible" : "No disponible"}</td><td className="text-right"><form action={eliminarDisponibilidadEspacio.bind(null, b.id)}><button className="text-red-700">Quitar</button></form></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
