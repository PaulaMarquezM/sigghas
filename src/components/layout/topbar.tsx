"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const TITULO_RUTA: Record<string, string> = {
  "/dashboard":                          "Inicio",
  "/dashboard/generar":                  "Generar Horario",
  "/dashboard/editar":                   "Editar Horario",
  "/dashboard/docentes":                 "Gestión de Docentes",
  "/dashboard/materias":                 "Gestión de Materias",
  "/dashboard/grupos":                   "Gestión de Cursos",
  "/dashboard/espacios":                 "Aulas y Laboratorios",
  "/dashboard/espacios/disponibilidad":  "Disponibilidad de Aulas",
  "/dashboard/disponibilidad":           "Disponibilidad Docente",
  "/dashboard/periodos":                 "Periodos Académicos",
  "/dashboard/reportes":                 "Reportes y Exportación",
  "/dashboard/usuarios":                 "Gestión de Usuarios",
  "/dashboard/sedes":                    "Sedes Académicas",
  "/dashboard/mi-horario":               "Mi Horario",
};

export function Topbar() {
  const pathname = usePathname();
  const titulo = TITULO_RUTA[pathname] ?? "SIGGHAS";

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 56,
      background: "#F5F1E8",
      borderBottom: "1px solid #D8D1BD",
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11, textTransform: "uppercase",
        letterSpacing: "0.12em", color: "#4A515E", fontWeight: 500,
      }}>
        {titulo}
      </span>
      <button style={{
        background: "transparent", border: "1px solid #D8D1BD",
        borderRadius: 8, width: 34, height: 34,
        display: "grid", placeItems: "center",
        cursor: "pointer", color: "#4A515E",
      }}>
        <Bell style={{ width: 15, height: 15 }} />
      </button>
    </header>
  );
}
