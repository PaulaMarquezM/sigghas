"use client";

import { useActionState } from "react";
import { Field, FormActions, FormMessage, NativeSelect } from "@/components/entities/FormShell";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/entities";

export type MateriaFormValue = {
  codigo?: string;
  nombre?: string;
  semestre?: number;
  horas_semana?: number;
  requiere_laboratorio?: boolean;
  nivel?: number;
  horas_teoria?: number;
  horas_practica?: number;
  modalidad?: string;
  activo?: boolean;
};

export function MateriaForm({
  action,
  value,
  cancelHref = "/dashboard/materias",
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  value?: MateriaFormValue;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage message={state.message} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Código" htmlFor="codigo" required={false} hint="Si lo dejas vacío, SIGGHAS asignará uno automáticamente.">
          <Input id="codigo" name="codigo" defaultValue={value?.codigo} minLength={2} placeholder="Ej. ISW-501" />
        </Field>
        <Field label="Nombre" htmlFor="nombre">
          <Input id="nombre" name="nombre" defaultValue={value?.nombre} required minLength={3} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nivel" htmlFor="nivel">
          <Input id="nivel" name="nivel" type="number" min={1} max={10} defaultValue={value?.nivel ?? value?.semestre ?? 1} required />
        </Field>
        <Field label="Modalidad" htmlFor="modalidad">
          <NativeSelect id="modalidad" name="modalidad" defaultValue={value?.modalidad ?? "presencial"} required>
            <option value="presencial">Presencial</option>
            <option value="hibrida">Híbrida</option>
            <option value="virtual">Virtual</option>
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Horas teoría" htmlFor="horas_teoria">
          <Input id="horas_teoria" name="horas_teoria" type="number" min={0} max={6} step="0.5" defaultValue={value?.horas_teoria ?? value?.horas_semana ?? 2} required />
        </Field>
        <Field label="Horas práctica" htmlFor="horas_practica">
          <Input id="horas_practica" name="horas_practica" type="number" min={0} max={6} step="0.5" defaultValue={value?.horas_practica ?? 0} required />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="requiere_laboratorio" defaultChecked={value?.requiere_laboratorio ?? false} className="size-4" />
          Requiere laboratorio
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="activo" defaultChecked={value?.activo ?? true} className="size-4" />
          Materia activa
        </label>
      </div>
      <FormActions cancelHref={cancelHref} />
    </form>
  );
}
