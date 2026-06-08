"use client";

import { useActionState } from "react";
import { Field, FormActions, FormMessage } from "@/components/entities/FormShell";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/entities";

export type PeriodoFormValue = {
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
};

export function PeriodoForm({
  action,
  value,
  cancelHref = "/dashboard/periodos",
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  value?: PeriodoFormValue;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage message={state.message} />
      <Field label="Nombre" htmlFor="nombre">
        <Input id="nombre" name="nombre" placeholder="2026-I" defaultValue={value?.nombre} required minLength={4} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha de inicio" htmlFor="fecha_inicio">
          <Input id="fecha_inicio" name="fecha_inicio" type="date" defaultValue={value?.fecha_inicio} required />
        </Field>
        <Field label="Fecha de fin" htmlFor="fecha_fin">
          <Input id="fecha_fin" name="fecha_fin" type="date" defaultValue={value?.fecha_fin} required />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="activo" defaultChecked={value?.activo ?? false} className="size-4" />
        Marcar como periodo activo
      </label>
      <FormActions cancelHref={cancelHref} />
    </form>
  );
}
