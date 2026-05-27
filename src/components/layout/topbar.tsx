"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const TITULO_RUTA: Record<string, string> = {
  "/dashboard":                          "Inicio",
  "/dashboard/generar":                  "Generar Horario",
  "/dashboard/editar":                   "Editar Horario",
  "/dashboard/docentes":                 "Gestión de Docentes",
  "/dashboard/materias":                 "Gestión de Materias",
  "/dashboard/grupos":                   "Gestión de Grupos",
  "/dashboard/espacios":                 "Aulas y Laboratorios",
  "/dashboard/espacios/disponibilidad":  "Disponibilidad de Espacios",
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
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-200 shrink-0">
      <h1 className="text-base font-semibold text-gray-800">{titulo}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
