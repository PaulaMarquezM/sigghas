"use client";

import { useActionState, useState } from "react";
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
  sede_ids?: string[];
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
  const [tipoContrato, setTipoContrato] = useState(value?.tipo_contrato ?? "por_horas");
  const [maxHoras, setMaxHoras] = useState(String(value?.max_horas_semana ?? (tipoContrato === "tiempo_completo" ? 40 : 20)));
  const [sedesAsignadas, setSedesAsignadas] = useState<string[]>(value?.sede_ids ?? (value?.sede_principal_id ? [value.sede_principal_id] : []));
  const [sedePrincipal, setSedePrincipal] = useState(value?.sede_principal_id ?? value?.sede_ids?.[0] ?? "");

  function cambiarContrato(nuevoTipo: string) {
    setTipoContrato(nuevoTipo);
    if (nuevoTipo === "tiempo_completo" && Number(maxHoras) < 40) setMaxHoras("40");
  }

  function cambiarSede(sedeId: string, asignada: boolean) {
    setSedesAsignadas((actuales) => {
      const siguientes = asignada ? [...new Set([...actuales, sedeId])] : actuales.filter((id) => id !== sedeId);
      if (sedePrincipal === sedeId && !asignada) setSedePrincipal(siguientes[0] ?? "");
      if (!sedePrincipal && asignada) setSedePrincipal(sedeId);
      return siguientes;
    });
  }

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
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tipo de contrato" htmlFor="tipo_contrato">
          <NativeSelect id="tipo_contrato" name="tipo_contrato" value={tipoContrato} onChange={(event) => cambiarContrato(event.target.value)} required>
            <option value="por_horas">Por horas</option>
            <option value="tiempo_completo">Tiempo completo</option>
            <option value="titular">Titular</option>
            <option value="contratado">Contratado</option>
            <option value="honorarios">Honorarios</option>
          </NativeSelect>
        </Field>
        <Field label="Horas máximas semanales" htmlFor="max_horas_semana">
          <Input id="max_horas_semana" name="max_horas_semana" type="number" min={tipoContrato === "tiempo_completo" ? 40 : 1} max={60} value={maxHoras} onChange={(event) => setMaxHoras(event.target.value)} required />
        </Field>
      </div>
      <fieldset className="rounded-lg border border-[#D8D1BD] bg-white p-4">
        <legend className="px-1 text-sm font-medium text-[#1F242D]">Sedes donde puede impartir clases <span className="text-[#C8523B]">*</span></legend>
        <p className="mb-3 text-xs text-[#727984]">Marca una o varias sedes. Después selecciona cuál de ellas será la sede principal.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {sedes.map((sede) => (
            <label key={sede.id} className="flex items-center gap-2 text-sm text-[#1F242D]">
              <input
                type="checkbox"
                name="sedes_ids"
                value={sede.id}
                checked={sedesAsignadas.includes(sede.id)}
                onChange={(event) => cambiarSede(sede.id, event.target.checked)}
                className="size-4 accent-[#1D3FD9]"
              />
              {sede.nombre}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Sede principal" htmlFor="sede_principal_id" hint={sedesAsignadas.length ? "Elige una de las sedes marcadas arriba." : "Primero marca al menos una sede."}>
        <NativeSelect id="sede_principal_id" name="sede_principal_id" value={sedePrincipal} onChange={(event) => setSedePrincipal(event.target.value)} disabled={!sedesAsignadas.length} required>
          <option value="">Seleccionar</option>
          {sedes.filter((sede) => sedesAsignadas.includes(sede.id)).map((sede) => (
            <option key={sede.id} value={sede.id}>{sede.nombre}</option>
          ))}
        </NativeSelect>
      </Field>
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
