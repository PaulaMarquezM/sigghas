import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GenerarForm } from "./GenerarForm";
import { AlertTriangle, BookOpen, Building2, UserCheck, Users } from "lucide-react";
import type { ComponentType } from "react";

export default async function GenerarPage() {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();

  const { data: periodos } = await supabase
    .from("periodos")
    .select("*")
    .order("nombre", { ascending: false });
  const { data: grupos } = await supabase.from("grupos").select("id, nombre, sede_id").eq("activo", true).order("nombre");
  const { data: sedes } = await supabase.from("sedes").select("id, nombre").order("nombre");

  const { count: statsMaterias } = await supabase.from("materias").select("id", { count: "exact", head: true });
  const { count: statsDocentes } = await supabase.from("docentes").select("id", { count: "exact", head: true });
  const { count: statsGrupos } = await supabase.from("grupos").select("id", { count: "exact", head: true }).eq("activo", true);
  const { count: statsEspacios } = await supabase.from("espacios").select("id", { count: "exact", head: true }).eq("disponible", true);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Generar Horario Automático</h2>
        <p className="text-sm text-gray-500 mt-1">
          El motor generará un horario completo respetando las 43 reglas de negocio.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatBox label="Materias" value={statsMaterias ?? 0} icon={BookOpen} />
        <StatBox label="Docentes" value={statsDocentes ?? 0} icon={UserCheck} />
        <StatBox label="Cursos activos" value={statsGrupos ?? 0} icon={Users} />
        <StatBox label="Aulas disponibles" value={statsEspacios ?? 0} icon={Building2} />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p><strong>Requisitos:</strong> Debes tener registrados docentes con disponibilidad horaria,
        materias, grupos activos y espacios disponibles. El periodo debe tener datos cargados.
        </p>
      </div>

      <GenerarForm periodos={periodos ?? []} grupos={grupos ?? []} sedes={sedes ?? []} />
    </div>
  );
}

function StatBox({ label, value, icon: Icon }: { label: string; value: number; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#0E1116] text-[#F5F1E8]">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
