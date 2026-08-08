"use client";

import { useState } from "react";
import { actualizarAsignacionDocente, eliminarAsignacionDocente } from "./actions";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";

export type AsignacionDocenteRowValue = {
  periodoId: string;
  materiaId: string;
  grupoId: string;
  docenteId: string;
  materiaNombre: string;
  cursoNombre: string;
  docenteNombre: string;
};

type DocenteOpcion = { id: string; nombre: string };

export function AsignacionDocenteRow({
  row,
  docentes,
}: {
  row: AsignacionDocenteRowValue;
  docentes: DocenteOpcion[];
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <tr className="border-t bg-blue-50/40">
        <td className="py-2">{row.materiaNombre}</td>
        <td>{row.cursoNombre}</td>
        <td colSpan={2}>
          <form
            action={actualizarAsignacionDocente.bind(null, row.periodoId, row.materiaId, row.grupoId)}
            onSubmit={() => setEditando(false)}
            className="flex flex-wrap items-center gap-2 py-1.5"
          >
            <select
              name="docente_id"
              defaultValue={row.docenteId}
              required
              className="min-w-0 rounded-lg border p-1.5 text-sm"
            >
              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>{docente.nombre}</option>
              ))}
            </select>
            <PendingSubmitButton pendingLabel="Guardando…" className="inline-flex items-center gap-1 rounded-lg bg-[#1D3FD9] px-3 py-1.5 text-xs font-semibold text-white">Guardar</PendingSubmitButton>
            <button type="button" onClick={() => setEditando(false)} className="text-xs font-medium text-gray-500">Cancelar</button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t">
      <td className="py-2">{row.materiaNombre}</td>
      <td>{row.cursoNombre}</td>
      <td>{row.docenteNombre}</td>
      <td className="space-x-3 text-right">
        <button type="button" onClick={() => setEditando(true)} className="font-medium text-[#1D3FD9]">Editar</button>
        <form action={eliminarAsignacionDocente.bind(null, row.periodoId, row.materiaId, row.grupoId)} className="inline">
          <PendingSubmitButton pendingLabel="Quitando…" className="inline-flex items-center gap-1 font-medium text-[#B33A2B]">Quitar</PendingSubmitButton>
        </form>
      </td>
    </tr>
  );
}
