import type { RolUsuario } from "@/types/database";
import {
  LayoutDashboard, Calendar, Users, BookOpen, Building2,
  Clock, FileText, Settings, DoorOpen, UserCheck,
} from "lucide-react";

export interface NavItem {
  label: string;
  href:  string;
  icon:  React.ComponentType<{ className?: string }>;
}

/** Menú disponible según el rol del usuario */
export const NAV_ITEMS: Record<RolUsuario, NavItem[]> = {
  coordinador: [
    { label: "Dashboard",          href: "/dashboard",                icon: LayoutDashboard },
    { label: "Generar Horario",    href: "/dashboard/generar",        icon: Calendar },
    { label: "Editar Horario",     href: "/dashboard/editar",         icon: Calendar },
    { label: "Docentes",           href: "/dashboard/docentes",       icon: UserCheck },
    { label: "Materias",           href: "/dashboard/materias",       icon: BookOpen },
    { label: "Grupos",             href: "/dashboard/grupos",         icon: Users },
    { label: "Aulas y Labs",       href: "/dashboard/espacios",       icon: Building2 },
    { label: "Disponibilidad",     href: "/dashboard/disponibilidad", icon: Clock },
    { label: "Periodos",           href: "/dashboard/periodos",       icon: Settings },
    { label: "Reportes PDF",       href: "/dashboard/reportes",       icon: FileText },
  ],
  docente: [
    { label: "Dashboard",          href: "/dashboard",                icon: LayoutDashboard },
    { label: "Mi Horario",         href: "/dashboard/mi-horario",     icon: Calendar },
    { label: "Disponibilidad",     href: "/dashboard/disponibilidad", icon: Clock },
    { label: "Exportar PDF",       href: "/dashboard/reportes",       icon: FileText },
  ],
  estudiante: [
    { label: "Dashboard",          href: "/dashboard",                icon: LayoutDashboard },
    { label: "Horario del Grupo",  href: "/dashboard/mi-horario",     icon: Calendar },
    { label: "Exportar PDF",       href: "/dashboard/reportes",       icon: FileText },
  ],
  administrador: [
    { label: "Dashboard",          href: "/dashboard",                icon: LayoutDashboard },
    { label: "Usuarios",           href: "/dashboard/usuarios",       icon: Users },
    { label: "Periodos",           href: "/dashboard/periodos",       icon: Settings },
    { label: "Sedes",              href: "/dashboard/sedes",          icon: Building2 },
  ],
  apoyo: [
    { label: "Dashboard",          href: "/dashboard",                icon: LayoutDashboard },
    { label: "Disponibilidad Aulas", href: "/dashboard/espacios/disponibilidad", icon: DoorOpen },
  ],
};
