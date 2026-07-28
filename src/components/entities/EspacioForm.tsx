"use client";

import { useActionState } from "react";
import { Field, FormActions, NativeSelect } from "@/components/entities/FormShell";
import { FormMessage } from "@/components/entities/FormShell";
import { Input } from "@/components/ui/input";
import type { ActionResult, Sede } from "@/lib/entities";

export type EspacioFormValue = {
  nombre?: string;
  tipo?: string;
  capacidad?: number;
  accesible?: boolean;
  sede_id?: string;
  disponible?: boolean;
  tiene_proyector?: boolean;
  tiene_internet?: boolean;
  activo?: boolean;
};

export function EspacioForm({
  action,
  sedes,
  value,
  cancelHref = "/dashboard/espacios",
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  sedes: Sede[];
  value?: EspacioFormValue;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: true });
  const numeroActual = value?.nombre?.match(/\d+[A-Za-z]?/)?.[0] ?? "";

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage message={state.message} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Número" htmlFor="numero" hint="El nombre se formará automáticamente, por ejemplo: Aula 204.">
          <Input id="numero" name="numero" defaultValue={numeroActual} required minLength={1} placeholder="204" inputMode="numeric" />
        </Field>
        <Field label="Tipo de aula" htmlFor="tipo">
          <NativeSelect id="tipo" name="tipo" defaultValue={value?.tipo} required>
            <option value="aula">Aula</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="sala_reuniones">Sala de reuniones</option>
            <option value="auditorio">Auditorio</option>
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Capacidad" htmlFor="capacidad">
          <Input id="capacidad" name="capacidad" type="number" min={1} max={500} defaultValue={value?.capacidad ?? 30} required />
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
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="accesible" defaultChecked={value?.accesible ?? false} className="size-4" />
          Accesible
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="tiene_proyector" defaultChecked={value?.tiene_proyector ?? false} className="size-4" />
          Tiene proyector
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="tiene_internet" defaultChecked={value?.tiene_internet ?? true} className="size-4" />
          Tiene internet
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="activo" defaultChecked={value?.activo ?? value?.disponible ?? true} className="size-4" />
          Aula activa y disponible
        </label>
      </div>
      <FormActions cancelHref={cancelHref} />
    </form>
  );
}
