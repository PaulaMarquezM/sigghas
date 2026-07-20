import { saveDisponibilidad } from "@/app/dashboard/docentes/actions";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

const DAYS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mie" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
  { id: 6, label: "Sáb" },
];

const HOURS = Array.from({ length: 18 }, (_, index) => 8 * 60 + index * 30);

export function DisponibilidadGrid({
  docenteId,
  selected,
}: {
  docenteId: string;
  selected: Set<string>;
}) {
  const action = saveDisponibilidad.bind(null, docenteId);

  return (
    <form action={action} className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-white">
        <div className="grid min-w-[820px]" style={{ gridTemplateColumns: "90px repeat(6, minmax(110px, 1fr))" }}>
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
                return (
                  <label key={value} className="flex min-h-10 items-center justify-center border-b border-l text-xs">
                    <input
                      type="checkbox"
                      name="bloques"
                      value={value}
                      defaultChecked={selected.has(value)}
                      className="peer sr-only"
                    />
                    <span className="w-full rounded px-2 py-2 text-center text-gray-500 peer-checked:bg-emerald-100 peer-checked:text-emerald-700">
                      Disponible
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Button type="submit">
        <Save className="size-4" />
        Guardar disponibilidad
      </Button>
    </form>
  );
}
