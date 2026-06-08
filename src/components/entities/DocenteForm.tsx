"use client";

import { useActionState } from "react";
import { Field, FormActions, NativeSelect } from "@/components/entities/FormShell";
import { FormMessage } from "@/components/entities/FormShell";
import { Input } from "@/components/ui/input";
import type { ActionResult, Sede } from "@/lib/entities";

export type DocenteFormValue = {
  nombre?: string;
  email?: string;
  tipo_contrato?: string;
  max_horas_semana?: number;
  sede_principal_id?: string | null;
  activo?: boolean;
};

export function DocenteForm({
  action,
  sedes,
  value,
  cancelHref = "/dashboard/docentes",
  includeIdentityFields = true,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  sedes: Sede[];
  value?: DocenteFormValue;
  cancelHref?: string;
  includeIdentityFields?: boolean;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage message={state.message} />
      {includeIdentityFields ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" htmlFor="nombre">
            <Input id="nombre" name="nombre" defaultValue={value?.nombre} required minLength={3} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={value?.email} required />
          </Field>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Tipo de contrato" htmlFor="tipo_contrato">
          <NativeSelect id="tipo_contrato" name="tipo_contrato" defaultValue={value?.tipo_contrato} required>
            <option value="por_horas">Por horas</option>
            <option value="tiempo_completo">Tiempo completo</option>
            <option value="titular">Titular</option>
            <option value="contratado">Contratado</option>
            <option value="honorarios">Honorarios</option>
          </NativeSelect>
        </Field>
        <Field label="Horas máximas semanales" htmlFor="max_horas_semana">
          <Input id="max_horas_semana" name="max_horas_semana" type="number" min={1} max={60} defaultValue={value?.max_horas_semana ?? 20} required />
        </Field>
        <Field label="Sede principal" htmlFor="sede_principal_id">
          <NativeSelect id="sede_principal_id" name="sede_principal_id" defaultValue={value?.sede_principal_id} required>
            <option value="">Seleccionar</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>{sede.nombre}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      {!includeIdentityFields ? (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="activo" defaultChecked={value?.activo ?? true} className="size-4" />
          Docente activo
        </label>
      ) : null}
      <FormActions cancelHref={cancelHref} />
    </form>
  );
}
