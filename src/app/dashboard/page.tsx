import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { QuickCard } from "./quick-card";

const LABEL_ROL: Record<string, string> = {
  coordinador:   "Coordinador Académico",
  docente:       "Docente",
  estudiante:    "Estudiante",
  administrador: "Administrador",
  apoyo:         "Personal de Apoyo",
};

export default async function DashboardPage() {
  const { perfil } = await getSession();
  if (!perfil) return null; // El layout ya se encarga de redirigir

  const supabase   = await createClient();

  const isCoord = perfil.rol === "coordinador" || perfil.rol === "administrador";

  const [{ count: totalDocentes }, { count: totalMaterias }, { count: totalGrupos }, { count: totalEspacios }] =
    await Promise.all([
      supabase.from("docentes").select("*", { count: "exact", head: true }),
      supabase.from("materias").select("*", { count: "exact", head: true }),
      supabase.from("grupos").select("*", { count: "exact", head: true }),
      supabase.from("espacios").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Docentes",  value: totalDocentes ?? 0,  icon: "👤" },
    { label: "Materias",  value: totalMaterias ?? 0,  icon: "📖" },
    { label: "Grupos",    value: totalGrupos ?? 0,    icon: "👥" },
    { label: "Espacios",  value: totalEspacios ?? 0,  icon: "🏛️" },
  ];

  const nombre = perfil.nombre.split(" ")[0] ?? "";

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Encabezado */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid #D8D1BD",
      }}>
        <div>
          <span style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
            textTransform: "uppercase", letterSpacing: "0.14em", color: "#4A515E",
          }}>
            Bienvenido de vuelta
          </span>
          <h1 style={{
            fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em",
            margin: "8px 0 6px", color: "#0E1116", lineHeight: 1.05,
          }}>
            {nombre}.
          </h1>
          <p style={{ fontSize: 14, color: "#4A515E", margin: 0 }}>
            Sistema de Gestión de Horarios · PUCE Carrera de Software
          </p>
        </div>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
          color: "#4A515E", border: "1px solid #D8D1BD",
          borderRadius: 999, padding: "5px 14px",
          background: "#EFEAD9",
        }}>
          {LABEL_ROL[perfil.rol]}
        </div>
      </div>

      {/* Stats — coordinador/admin */}
      {isCoord && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 36 }}>
          {stats.map(({ label, value, icon }) => (
            <div key={label} style={{
              background: "#EFEAD9", border: "1px solid #D8D1BD",
              borderRadius: 12, padding: "20px 22px",
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 32, fontWeight: 500, letterSpacing: "-0.03em", color: "#0E1116",
              }}>
                {value}
              </div>
              <div style={{ fontSize: 13, color: "#4A515E", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <span style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
          textTransform: "uppercase", letterSpacing: "0.12em", color: "#4A515E",
          display: "block", marginBottom: 14,
        }}>
          Accesos rápidos
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>

          {perfil.rol === "coordinador" && (
            <>
              <QuickCard icon="Calendar" title="Generar Horario" desc="Genera automáticamente el horario del periodo actual con validación de restricciones." href="/dashboard/generar" />
              <QuickCard icon="Clock" title="Disponibilidad Docente" desc="Registra y gestiona los bloques horarios disponibles de cada docente." href="/dashboard/disponibilidad" />
              <QuickCard icon="Building2" title="Gestionar Espacios" desc="Administra aulas y laboratorios disponibles en Manta y Portoviejo." href="/dashboard/espacios" />
              <QuickCard icon="Users" title="Gestionar Grupos" desc="Registra y administra los grupos académicos de la carrera." href="/dashboard/grupos" />
            </>
          )}

          {(perfil.rol === "docente" || perfil.rol === "estudiante") && (
            <>
              <QuickCard icon="Calendar" title="Ver mi Horario" desc="Consulta tu horario académico del periodo actual." href="/dashboard/mi-horario" />
              <QuickCard icon="BookOpen" title="Exportar PDF" desc="Descarga tu horario en PDF (los estudiantes eligen su grupo primero)." href="/dashboard/reportes" />
            </>
          )}

          {perfil.rol === "apoyo" && (
            <QuickCard icon="Building2" title="Disponibilidad de Aulas" desc="Consulta qué aulas y laboratorios están disponibles u ocupados." href="/dashboard/espacios/disponibilidad" />
          )}
        </div>
      </div>
    </div>
  );
}

