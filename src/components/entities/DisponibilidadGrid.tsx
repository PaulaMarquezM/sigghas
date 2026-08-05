"use client";

import { useEffect, useRef, useState } from "react";
import { saveDisponibilidad } from "@/app/dashboard/docentes/actions";
import { Save } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";

const DAYS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mie" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
  { id: 6, label: "Sáb" },
];

const HOURS = Array.from({ length: 18 }, (_, index) => 8 * 60 + index * 30);

type Arrastre = { marcar: boolean; visitados: Set<string> };

export function DisponibilidadGrid({
  docenteId,
  selected,
}: {
  docenteId: string;
  selected: string[];
}) {
  const action = saveDisponibilidad.bind(null, docenteId);
  const [seleccionados, setSeleccionados] = useState(() => new Set(selected));
  const arrastre = useRef<Arrastre | null>(null);

  useEffect(() => {
    const terminarArrastre = () => { arrastre.current = null; };
    window.addEventListener("pointerup", terminarArrastre);
    window.addEventListener("pointercancel", terminarArrastre);
    return () => {
      window.removeEventListener("pointerup", terminarArrastre);
      window.removeEventListener("pointercancel", terminarArrastre);
    };
  }, []);

  const actualizarSeleccion = (value: string, marcar: boolean) => {
    setSeleccionados((actuales) => {
      if (actuales.has(value) === marcar) return actuales;
      const siguiente = new Set(actuales);
      if (marcar) siguiente.add(value);
      else siguiente.delete(value);
      return siguiente;
    });
  };

  const iniciarArrastre = (value: string) => {
    const marcar = !seleccionados.has(value);
    arrastre.current = { marcar, visitados: new Set([value]) };
    actualizarSeleccion(value, marcar);
  };

  const continuarArrastre = (value?: string) => {
    const actual = arrastre.current;
    if (!actual || !value || actual.visitados.has(value)) return;
    actual.visitados.add(value);
    actualizarSeleccion(value, actual.marcar);
  };

  return (
    <form action={action} className="space-y-4">
      {[...seleccionados].map((value) => <input key={value} name="bloques" type="hidden" value={value} />)}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <div
          className="grid min-w-[820px] select-none"
          style={{ gridTemplateColumns: "90px repeat(6, minmax(110px, 1fr))" }}
          onPointerMove={(event) => {
            const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-bloque]");
            continuarArrastre(cell?.dataset.bloque);
          }}
        >
          <div className="border-b bg-gray-50 p-2 text-xs font-semibold text-gray-500">Hora</div>
          {DAYS.map((day) => (
            <div key={day.id} className="border-b border-l bg-gray-50 p-2 text-center text-xs font-semibold text-gray-700">
              {day.label}
            </div>
          ))}
          {HOURS.map((minute) => (
            <div key={minute} className="contents">
              <div key={`h-${minute}`} className="border-b bg-gray-50 p-2 text-xs text-gray-500">
                {String(Math.floor(minute / 60)).padStart(2, "0")}:{String(minute % 60).padStart(2, "0")}
              </div>
              {DAYS.map((day) => {
                const value = `${day.id}-${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
                const marcado = seleccionados.has(value);
                return (
                  <button
                    key={value}
                    aria-pressed={marcado}
                    className={`flex min-h-10 touch-none items-center justify-center border-b border-l px-2 py-2 text-xs transition-colors ${marcado ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}`}
                    data-bloque={value}
                    onClick={(event) => {
                      if (event.detail === 0) actualizarSeleccion(value, !marcado);
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      iniciarArrastre(value);
                    }}
                    type="button"
                  >
                    Disponible
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">Haz clic o arrastra sobre varias celdas para marcar una franja. Arrastra desde una celda marcada para desmarcarla.</p>
      <PendingSubmitButton pendingLabel="Guardando…" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
        <Save className="size-4" />
        Guardar disponibilidad
      </PendingSubmitButton>
    </form>
  );
}
