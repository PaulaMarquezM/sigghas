"use client";

import { useTransition, type FormEvent } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { editarSesionManualAction, eliminarSesionManualAction } from "./actions";
import type { OpcionesManuales } from "./NuevaSesionDialog";

type SesionEditable = { id: string; materia_id: string; grupo_id: string; docente_id: string; espacio_id: string | null; dia_semana: number; hora_inicio: string; hora_fin: string };

export function EditarSesionDialog({ horarioId, sesion, opciones, onClose }: { horarioId: string; sesion: SesionEditable; opciones: OpcionesManuales; onClose: () => void }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const inputClass = "h-10 w-full rounded-lg border border-[#C7BFA6] bg-white px-3 text-sm outline-none focus:border-[#1D3FD9] focus:ring-2 focus:ring-[#1D3FD9]/15";
  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
    const resultado = await editarSesionManualAction(horarioId, sesion.id, { materia_id: String(formData.get("materia_id") ?? ""), grupo_id: String(formData.get("grupo_id") ?? ""), docente_id: String(formData.get("docente_id") ?? ""), espacio_id: String(formData.get("espacio_id") ?? "") || null, dia_semana: Number(formData.get("dia_semana")), hora_inicio: String(formData.get("hora_inicio") ?? ""), hora_fin: String(formData.get("hora_fin") ?? "") });
    if (!resultado.exito) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Clase actualizada."); onClose(); router.refresh();
    });
  };
  const eliminar = () => {
    if (!window.confirm("¿Eliminar esta clase? Esta acción quedará registrada en el historial.")) return;
    startTransition(async () => { const resultado = await eliminarSesionManualAction(horarioId, sesion.id); if (!resultado.exito) { toast.error(resultado.error); return; } toast.success("Clase eliminada."); onClose(); router.refresh(); });
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="editar-clase-titulo">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#D8D1BD] bg-[#F5F1E8] p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between"><div><h2 id="editar-clase-titulo" className="flex items-center gap-2 text-2xl font-semibold"><Pencil className="size-5 text-[#1D3FD9]" />Editar clase</h2><p className="mt-1 text-sm text-gray-600">Los cambios se validan contra las reglas antes de guardarse.</p></div><button type="button" onClick={onClose} disabled={pendiente} aria-label="Cerrar"><X className="size-5" /></button></div>
      <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">Curso *<select name="grupo_id" defaultValue={sesion.grupo_id} className={inputClass}>{opciones.cursos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-medium">Materia *<select name="materia_id" defaultValue={sesion.materia_id} className={inputClass}>{opciones.materias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-medium">Docente *<select name="docente_id" defaultValue={sesion.docente_id} className={inputClass}>{opciones.docentes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-medium">Aula <span className="text-xs font-normal text-gray-500">(solo presencial)</span><select name="espacio_id" defaultValue={sesion.espacio_id ?? ""} className={inputClass}><option value="">Sin aula</option>{opciones.aulas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-medium">Día *<select name="dia_semana" defaultValue={sesion.dia_semana} className={inputClass}>{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((dia, index) => <option key={dia} value={index + 1}>{dia}</option>)}</select></label>
        <div className="hidden sm:block" />
        <label className="grid gap-1.5 text-sm font-medium">Desde *<input name="hora_inicio" type="time" step="1800" defaultValue={sesion.hora_inicio.slice(0, 5)} required className={inputClass} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Hasta *<input name="hora_fin" type="time" step="1800" defaultValue={sesion.hora_fin.slice(0, 5)} required className={inputClass} /></label>
        <div className="flex flex-col-reverse gap-3 border-t border-[#D8D1BD] pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={eliminar} disabled={pendiente} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">{pendiente ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Procesando…</> : <><Trash2 className="size-4" />Eliminar clase</>}</button><div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={pendiente} className="rounded-lg border border-[#C7BFA6] px-4 py-2.5 text-sm font-medium disabled:opacity-50">Cancelar</button><button disabled={pendiente} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0E1116] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Guardando…</> : "Guardar cambios"}</button></div></div>
      </form>
    </div>
  </div>;
}
