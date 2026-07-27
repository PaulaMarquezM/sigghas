"use client";

import { useActionState } from "react";
import { Field, FormActions, NativeSelect } from "@/components/entities/FormShell";
import { FormMessage } from "@/components/entities/FormShell";
import { Input } from "@/components/ui/input";
import type { ActionResult, Sede } from "@/lib/entities";
import type { RolUsuario } from "@/types/database";

// "docente" no se crea/edita aquí: tiene su propio flujo en /dashboard/docentes
// porque además necesita tipo_contrato, horas máximas, etc.
const ROLES_DISPONIBLES: { value: RolUsuario; label: string }[] = [
  { value: "coordinador", label: "Coordinador Académico" },
  { value: "administrador", label: "Administrador" },
  { value: "apoyo", label: "Personal de Apoyo" },
  { value: "estudiante", label: "Estudiante" },
];

export type UsuarioFormValue = {
  rol?: RolUsuario;
  sede_id?: string | null;
  activo?: boolean;
};

export function UsuarioForm({
  action,
  sedes,
  value,
  includeIdentityFields = true,
  cancelHref = "/dashboard/usuarios",
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  sedes: Sede[];
  value?: UsuarioFormValue & { nombre?: string; email?: string };
  includeIdentityFields?: boolean;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage message={state.message} />

      {includeIdentityFields && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" htmlFor="nombre">
            <Input id="nombre" name="nombre" defaultValue={value?.nombre} required minLength={2} />
          </Field>
          <Field label="Correo institucional" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={value?.email} required />
          </Field>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Rol" htmlFor="rol">
          <NativeSelect id="rol" name="rol" defaultValue={value?.rol ?? "estudiante"} required>
            {ROLES_DISPONIBLES.map((rol) => (
              <option key={rol.value} value={rol.value}>{rol.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Sede" htmlFor="sede_id">
          <NativeSelect id="sede_id" name="sede_id" defaultValue={value?.sede_id ?? ""}>
            <option value="">Sin sede</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>{sede.nombre}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {!includeIdentityFields && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="activo" defaultChecked={value?.activo ?? true} className="size-4" />
          Usuario activo
        </label>
      )}

      <FormActions cancelHref={cancelHref} />
    </form>
  );
}
