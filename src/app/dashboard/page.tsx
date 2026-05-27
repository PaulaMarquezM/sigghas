import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Building2, Calendar, Clock, UserCheck } from "lucide-react";

const LABEL_ROL: Record<string, string> = {
  coordinador:   "Coordinador Académico",
  docente:       "Docente",
  estudiante:    "Estudiante",
  administrador: "Administrador",
  apoyo:         "Personal de Apoyo",
};

export default async function DashboardPage() {
  const { perfil } = await getSession();
  const supabase   = await createClient();

  // Estadísticas básicas (solo coordinador/admin ven todo)
  const isCoord = perfil?.rol === "coordinador" || perfil?.rol === "administrador";

  const [{ count: totalDocentes }, { count: totalMaterias }, { count: totalGrupos }, { count: totalEspacios }] =
    await Promise.all([
      supabase.from("docentes").select("*", { count: "exact", head: true }),
      supabase.from("materias").select("*", { count: "exact", head: true }),
      supabase.from("grupos").select("*", { count: "exact", head: true }),
      supabase.from("espacios").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Docentes",  value: totalDocentes ?? 0,  icon: UserCheck,  color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Materias",  value: totalMaterias ?? 0,  icon: BookOpen,   color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Grupos",    value: totalGrupos ?? 0,    icon: Users,      color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Espacios",  value: totalEspacios ?? 0,  icon: Building2,  color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Bienvenida */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Bienvenido, {perfil?.nombre.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Sistema de Gestión de Horarios · PUCE Carrera de Software
          </p>
        </div>
        <Badge variant="secondary" className="text-xs px-3 py-1">
          {LABEL_ROL[perfil?.rol ?? "estudiante"]}
        </Badge>
      </div>

      {/* Stats — solo para coordinador / admin */}
      {isCoord && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accesos rápidos por rol */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perfil?.rol === "coordinador" && (
          <>
            <QuickCard
              icon={Calendar}
              title="Generar Horario"
              desc="Genera automáticamente el horario del periodo actual con validación de restricciones."
              href="/dashboard/generar"
              color="indigo"
            />
            <QuickCard
              icon={Clock}
              title="Disponibilidad Docente"
              desc="Registra y gestiona los bloques horarios disponibles de cada docente."
              href="/dashboard/disponibilidad"
              color="emerald"
            />
            <QuickCard
              icon={Building2}
              title="Gestionar Espacios"
              desc="Administra aulas y laboratorios disponibles en Manta y Portoviejo."
              href="/dashboard/espacios"
              color="orange"
            />
            <QuickCard
              icon={Users}
              title="Gestionar Grupos"
              desc="Registra y administra los grupos académicos de la carrera."
              href="/dashboard/grupos"
              color="blue"
            />
          </>
        )}

        {(perfil?.rol === "docente" || perfil?.rol === "estudiante") && (
          <>
            <QuickCard
              icon={Calendar}
              title="Ver mi Horario"
              desc="Consulta tu horario académico del periodo actual."
              href="/dashboard/mi-horario"
              color="indigo"
            />
            <QuickCard
              icon={Building2}
              title="Exportar PDF"
              desc="Descarga tu horario en formato PDF para consulta offline."
              href="/dashboard/reportes"
              color="emerald"
            />
          </>
        )}

        {perfil?.rol === "apoyo" && (
          <QuickCard
            icon={Building2}
            title="Disponibilidad de Aulas"
            desc="Consulta qué aulas y laboratorios están disponibles u ocupados."
            href="/dashboard/espacios/disponibilidad"
            color="orange"
          />
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Componente auxiliar: tarjeta de acceso rápido
// ────────────────────────────────────────────────
const COLOR_MAP = {
  indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600",  border: "hover:border-indigo-200" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "hover:border-emerald-200" },
  orange:  { bg: "bg-orange-50",  icon: "text-orange-600",  border: "hover:border-orange-200" },
  blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    border: "hover:border-blue-200" },
} as const;

function QuickCard({
  icon: Icon, title, desc, href, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; href: string;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <a href={href}>
      <Card className={`border shadow-sm transition-all cursor-pointer hover:shadow-md ${c.border}`}>
        <CardHeader className="pb-2">
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
          <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </a>
  );
}
