import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GenerarForm } from "./GenerarForm";

export default async function GenerarPage() {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();

  const { data: periodos } = await supabase
    .from("periodos")
    .select("*")
    .order("nombre", { ascending: false });

  const { count: statsMaterias } = await supabase.from("materias").select("id", { count: "exact", head: true });
  const { count: statsDocentes } = await supabase.from("docentes").select("id", { count: "exact", head: true });
  const { count: statsGrupos } = await supabase.from("grupos").select("id", { count: "exact", head: true }).eq("activo", true);
  const { count: statsEspacios } = await supabase.from("espacios").select("id", { count: "exact", head: true }).eq("disponible", true);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Generar Horario Automático</h2>
        <p className="text-sm text-gray-500 mt-1">
          El motor generará un horario completo respetando las 43 reglas de negocio.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatBox label="Materias" value={statsMaterias ?? 0} />
        <StatBox label="Docentes" value={statsDocentes ?? 0} />
        <StatBox label="Grupos activos" value={statsGrupos ?? 0} />
        <StatBox label="Espacios" value={statsEspacios ?? 0} />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>⚠️ Requisitos:</strong> Debes tener registrados docentes con disponibilidad horaria,
        materias, grupos activos y espacios disponibles. El periodo debe tener datos cargados.
      </div>

      <GenerarForm periodos={periodos ?? []} />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
