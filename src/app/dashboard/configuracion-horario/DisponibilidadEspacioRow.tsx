"use client";

import { useState } from "react";
import { actualizarDisponibilidadEspacio, eliminarDisponibilidadEspacio } from "./actions";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export type DisponibilidadEspacioRowValue = {
  id: string;
  espacioNombre: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
};

export function DisponibilidadEspacioRow({ row }: { row: DisponibilidadEspacioRowValue }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <tr className="border-t bg-blue-50/40">
        <td className="py-2">{row.espacioNombre}</td>
        <td colSpan={4}>
          <form
            action={actualizarDisponibilidadEspacio.bind(null, row.id)}
            onSubmit={() => setEditando(false)}
            className="flex flex-wrap items-center gap-2 py-1.5"
          >
            <select name="dia_semana" defaultValue={row.dia_semana} className="rounded-lg border p-1.5 text-sm">
              {DIAS.map((dia, index) => <option key={dia} value={index + 1}>{dia}</option>)}
            </select>
            <input name="hora_inicio" type="time" min="08:00" max="17:00" step="1800" defaultValue={row.hora_inicio.slice(0, 5)} required className="rounded-lg border p-1.5 text-sm" />
            <span>–</span>
            <input name="hora_fin" type="time" min="08:00" max="17:00" step="1800" defaultValue={row.hora_fin.slice(0, 5)} required className="rounded-lg border p-1.5 text-sm" />
            <label className="flex items-center gap-1.5 text-sm">
              <input name="disponible" type="checkbox" defaultChecked={row.disponible} />
              Disponible
            </label>
            <PendingSubmitButton pendingLabel="Guardando…" className="inline-flex items-center gap-1 rounded-lg bg-[#1D3FD9] px-3 py-1.5 text-xs font-semibold text-white">Guardar</PendingSubmitButton>
            <button type="button" onClick={() => setEditando(false)} className="text-xs font-medium text-gray-500">Cancelar</button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t">
      <td className="py-2">{row.espacioNombre}</td>
      <td>{DIAS[row.dia_semana - 1]}</td>
      <td>{row.hora_inicio.slice(0, 5)}–{row.hora_fin.slice(0, 5)}</td>
      <td>{row.disponible ? "Disponible" : "No disponible"}</td>
      <td className="text-right space-x-3">
        <button type="button" onClick={() => setEditando(true)} className="font-medium text-[#1D3FD9]">Editar</button>
        <form action={eliminarDisponibilidadEspacio.bind(null, row.id)} className="inline">
          <PendingSubmitButton pendingLabel="Quitando…" className="inline-flex items-center gap-1 font-medium text-[#B33A2B]">Quitar</PendingSubmitButton>
        </form>
      </td>
    </tr>
  );
}
