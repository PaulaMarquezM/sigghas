"use client";

import { useActionState } from "react";
import { Field, FormActions } from "@/components/entities/FormShell";
import { FormMessage } from "@/components/entities/FormShell";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/entities";

export type SedeFormValue = {
  nombre?: string;
  es_central?: boolean;
};

export function SedeForm({
  action,
  value,
  cancelHref = "/dashboard/sedes",
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  value?: SedeFormValue;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage message={state.message} />
      <Field label="Nombre" htmlFor="nombre">
        <Input id="nombre" name="nombre" placeholder="Portoviejo" defaultValue={value?.nombre} required minLength={2} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="es_central" defaultChecked={value?.es_central ?? false} className="size-4" />
        Sede central
      </label>
      <FormActions cancelHref={cancelHref} />
    </form>
  );
}
