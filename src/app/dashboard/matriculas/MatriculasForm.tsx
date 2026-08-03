"use client";
import { useState } from "react";
import { crearMatricula } from "./actions";

type Opcion = { id: string; nombre: string; email?: string; semestre?: number };
export function MatriculasForm({ estudiantes, periodos, materias, grupos, opcionesValidas }: { estudiantes: Opcion[]; periodos: Opcion[]; materias: Opcion[]; grupos: Opcion[]; opcionesValidas: Array<{ materia_id: string; grupo_id: string }> }) {
  const [mensaje, setMensaje] = useState(""); const [loading, setLoading] = useState(false);
  const [materiaId, setMateriaId] = useState("");
  async function submit(formData: FormData) { setLoading(true); const r = await crearMatricula(Object.fromEntries(formData) as { estudiante_id: string; periodo_id: string; materia_id: string; grupo_id: string; motivo: string }); setMensaje(r.message); setLoading(false); }
  return <form action={submit} className="grid gap-4 rounded-xl border border-[#D8D1BD] bg-white p-5 md:grid-cols-2">
    <label className="grid gap-1 text-sm">Estudiante<select name="estudiante_id" required><option value="">Selecciona</option>{estudiantes.map(x => <option key={x.id} value={x.id}>{x.nombre}{x.email ? ` — ${x.email}` : ""}</option>)}</select></label>
    <label className="grid gap-1 text-sm">Período<select name="periodo_id" required><option value="">Selecciona</option>{periodos.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
    <label className="grid gap-1 text-sm">Materia<select name="materia_id" required value={materiaId} onChange={(e) => setMateriaId(e.target.value)}><option value="">Selecciona</option>{materias.filter(x => opcionesValidas.some(o => o.materia_id === x.id)).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
    <label className="grid gap-1 text-sm">Curso<select name="grupo_id" required disabled={!materiaId}><option value="">Selecciona</option>{grupos.filter(x => opcionesValidas.some(o => o.materia_id === materiaId && o.grupo_id === x.id)).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
    <label className="grid gap-1 text-sm">Motivo<select name="motivo" defaultValue="regular"><option value="regular">Regular</option><option value="arrastre">Arrastre</option><option value="repeticion">Repetición</option><option value="convalidacion">Convalidación</option></select></label>
    <div className="flex items-end"><button disabled={loading} className="s-btn s-btn-primary" type="submit">{loading ? "Guardando..." : "Registrar matrícula"}</button></div>
    {mensaje && <p className="md:col-span-2 text-sm" aria-live="polite">{mensaje}</p>}
  </form>;
}
