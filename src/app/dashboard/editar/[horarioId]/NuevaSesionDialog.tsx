"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearSesionManualAction } from "./actions";

export type OpcionesManuales = {
  materias: { id: string; nombre: string; semestre: number; modalidad: string }[];
  cursos: { id: string; nombre: string; semestre: number; sede_id: string }[];
  docentes: { id: string; nombre: string }[];
  aulas: { id: string; nombre: string; sede_id: string }[];
};

export function NuevaSesionDialog({ horarioId, opciones }: { horarioId: string; opciones: OpcionesManuales }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const [semestre, setSemestre] = useState(String(opciones.cursos[0]?.semestre ?? 1));
  const materias = useMemo(() => opciones.materias.filter((item) => String(item.semestre) === semestre), [opciones.materias, semestre]);
  const cursos = useMemo(() => opciones.cursos.filter((item) => String(item.semestre) === semestre), [opciones.cursos, semestre]);
  const inputClass = "h-11 w-full min-w-0 rounded-lg border border-[#C7BFA6] bg-white px-3 text-sm outline-none focus:border-[#1D3FD9] focus:ring-2 focus:ring-[#1D3FD9]/15";

  function guardar(formData: FormData) {
    startTransition(async () => {
      const resultado = await crearSesionManualAction(horarioId, {
        materia_id: String(formData.get("materia_id") ?? ""),
        grupo_id: String(formData.get("grupo_id") ?? ""),
        docente_id: String(formData.get("docente_id") ?? ""),
        espacio_id: String(formData.get("espacio_id") ?? "") || null,
        dia_semana: Number(formData.get("dia_semana")),
        hora_inicio: String(formData.get("hora_inicio") ?? ""),
        hora_fin: String(formData.get("hora_fin") ?? ""),
      });
      if (!resultado.exito) {
        toast.error(resultado.error);
        return;
      }
      toast.success("Clase agregada al horario.");
      setAbierto(false);
      router.refresh();
    });
  }

  return <>
    <button onClick={() => setAbierto(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#1D3FD9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1733B5]"><Plus className="size-4" />Agregar clase</button>
    {abierto && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="nueva-clase-titulo">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#D8D1BD] bg-[#F5F1E8] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><h2 id="nueva-clase-titulo" className="text-2xl font-semibold">Agregar clase manualmente</h2><p className="mt-1 text-sm text-gray-600">Selecciona curso, materia, docente, aula y hora. Las reglas se validarán antes de guardar.</p></div><button onClick={() => setAbierto(false)} aria-label="Cerrar"><X className="size-5" /></button></div>
        <form action={guardar} className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Semestre *<select value={semestre} onChange={(e) => setSemestre(e.target.value)} className={inputClass}>{[...new Set(opciones.cursos.map((item) => item.semestre))].sort().map((item) => <option key={item} value={item}>{item}.º semestre</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Curso *<select key={`curso-${semestre}`} name="grupo_id" required className={inputClass}><option value="">Selecciona</option>{cursos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Materia *<select key={`materia-${semestre}`} name="materia_id" required className={inputClass}><option value="">Selecciona</option>{materias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Docente *<select name="docente_id" required className={inputClass}><option value="">Selecciona</option>{opciones.docentes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Aula <span className="text-xs font-normal text-gray-500">(solo presencial)</span><select name="espacio_id" className={inputClass}><option value="">Sin aula</option>{opciones.aulas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Día *<select name="dia_semana" required className={inputClass}>{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((dia, index) => <option key={dia} value={index + 1}>{dia}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Desde *<input name="hora_inicio" type="time" min="08:00" max="17:00" step="1800" defaultValue="08:00" required className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-medium">Hasta *<input name="hora_fin" type="time" min="08:00" max="17:00" step="1800" defaultValue="10:00" required className={inputClass} /></label>
          <div className="flex justify-end gap-3 border-t border-[#D8D1BD] pt-4 sm:col-span-2"><button type="button" onClick={() => setAbierto(false)} className="rounded-lg border border-[#C7BFA6] px-4 py-2.5 text-sm font-medium">Cancelar</button><button disabled={pendiente} className="rounded-lg bg-[#0E1116] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Validando…" : "Agregar clase"}</button></div>
        </form>
      </div>
    </div>}
  </>;
}
