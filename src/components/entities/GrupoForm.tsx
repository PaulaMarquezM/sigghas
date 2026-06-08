"use client";

import { useActionState } from "react";
import { Field, FormActions, NativeSelect } from "@/components/entities/FormShell";
import { FormMessage } from "@/components/entities/FormShell";
import { Input } from "@/components/ui/input";
import type { ActionResult, Sede } from "@/lib/entities";

export type GrupoFormValue = {
  nombre?: string;
  semestre?: number;
  cantidad_estudiantes?: number;
  sede_id?: string;
  requiere_accesibilidad?: boolean;
  activo?: boolean;
};

export function GrupoForm({
  action,
  sedes,
  value,
  cancelHref = "/dashboard/grupos",
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  sedes: Sede[];
  value?: GrupoFormValue;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage message={state.message} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre" htmlFor="nombre">
          <Input id="nombre" name="nombre" placeholder="SW-5A" defaultValue={value?.nombre} required minLength={2} />
        </Field>
        <Field label="Sede" htmlFor="sede_id">
          <NativeSelect id="sede_id" name="sede_id" defaultValue={value?.sede_id} required>
            <option value="">Seleccionar</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>{sede.nombre}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Semestre" htmlFor="semestre">
          <Input id="semestre" name="semestre" type="number" min={1} max={10} defaultValue={value?.semestre ?? 1} required />
        </Field>
        <Field label="Cantidad de estudiantes" htmlFor="cantidad_estudiantes">
          <Input id="cantidad_estudiantes" name="cantidad_estudiantes" type="number" min={0} max={200} defaultValue={value?.cantidad_estudiantes ?? 0} required />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="requiere_accesibilidad" defaultChecked={value?.requiere_accesibilidad ?? false} className="size-4" />
          Requiere accesibilidad
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="activo" defaultChecked={value?.activo ?? true} className="size-4" />
          Grupo activo
        </label>
      </div>
      <FormActions cancelHref={cancelHref} />
    </form>
  );
}
