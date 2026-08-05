"use client";
import { useState } from "react";
import { BookOpen, CalendarDays, CircleCheck, Loader2, Tag, UserRound, UsersRound } from "lucide-react";
import { crearMatricula } from "./actions";

type Opcion = { id: string; nombre: string; email?: string; semestre?: number };
export function MatriculasForm({ estudiantes, periodos, materias, grupos, opcionesValidas }: { estudiantes: Opcion[]; periodos: Opcion[]; materias: Opcion[]; grupos: Opcion[]; opcionesValidas: Array<{ materia_id: string; grupo_id: string }> }) {
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null); const [loading, setLoading] = useState(false);
  const [materiaId, setMateriaId] = useState("");
  async function submit(formData: FormData) {
    setLoading(true);
    const resultado = await crearMatricula(Object.fromEntries(formData) as { estudiante_id: string; periodo_id: string; materia_id: string; grupo_id: string; motivo: string });
    setMensaje({ texto: resultado.message, ok: resultado.ok });
    setLoading(false);
  }

  const selectClass = "h-12 w-full rounded-lg border border-[#C7BFA6] bg-white px-3 text-[15px] text-[#1F242D] outline-none transition focus:border-[#1D3FD9] focus:ring-4 focus:ring-[#1D3FD9]/10 disabled:cursor-not-allowed disabled:bg-[#F4F1E8] disabled:text-[#8A8F99]";

  return <form action={submit} className="overflow-hidden rounded-2xl border border-[#D8D1BD] bg-white shadow-sm">
    <div className="border-b border-[#E6E0D0] bg-[#FEFCF6] px-6 py-5">
      <p className="font-semibold text-[#1F242D]">Datos de la matrícula</p>
      <p className="mt-1 text-sm text-[#697180]">Los campos con asterisco son obligatorios. El curso se habilita al seleccionar una materia.</p>
    </div>

    <div className="grid gap-5 p-6 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium text-[#252B36]">
        <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[#1D3FD9]" aria-hidden />Estudiante <span className="text-[#C8523B]">*</span></span>
        <select name="estudiante_id" required className={selectClass}><option value="">Selecciona un estudiante</option>{estudiantes.map(x => <option key={x.id} value={x.id}>{x.nombre}{x.email ? ` — ${x.email}` : ""}</option>)}</select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-[#252B36]">
        <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#1D3FD9]" aria-hidden />Período <span className="text-[#C8523B]">*</span></span>
        <select name="periodo_id" required className={selectClass}><option value="">Selecciona un período</option>{periodos.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-[#252B36]">
        <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#1D3FD9]" aria-hidden />Materia <span className="text-[#C8523B]">*</span></span>
        <select name="materia_id" required value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className={selectClass}><option value="">Selecciona una materia</option>{materias.filter(x => opcionesValidas.some(o => o.materia_id === x.id)).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-[#252B36]">
        <span className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#1D3FD9]" aria-hidden />Curso <span className="text-[#C8523B]">*</span></span>
        <select name="grupo_id" required disabled={!materiaId} className={selectClass}><option value="">{materiaId ? "Selecciona un curso" : "Primero selecciona una materia"}</option>{grupos.filter(x => opcionesValidas.some(o => o.materia_id === materiaId && o.grupo_id === x.id)).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-[#252B36] md:max-w-[calc(50%-0.625rem)]">
        <span className="flex items-center gap-2"><Tag className="h-4 w-4 text-[#1D3FD9]" aria-hidden />Motivo</span>
        <select name="motivo" defaultValue="regular" className={selectClass}><option value="regular">Regular</option><option value="arrastre">Arrastre</option><option value="repeticion">Repetición</option><option value="convalidacion">Convalidación</option></select>
      </label>
    </div>

    <div className="flex flex-col gap-3 border-t border-[#E6E0D0] bg-[#FEFCF6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-[#697180]">Solo se muestran cursos con una clase publicada para la materia seleccionada.</p>
      <button disabled={loading} aria-busy={loading} className="s-btn s-btn-primary min-w-[190px] justify-center" type="submit">{loading ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Guardando…</> : "Registrar matrícula"}</button>
    </div>

    {mensaje && <div className={`mx-6 mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${mensaje.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#E7A796] bg-[#FFF1ED] text-[#7F2E20]"}`} aria-live="polite"><CircleCheck className="h-4 w-4 shrink-0" aria-hidden />{mensaje.texto}</div>}
  </form>;
}
