"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, BookOpen, Building2,
  Clock, FileText, Settings, DoorOpen, UserCheck, LogOut, Eye, SlidersHorizontal
} from "lucide-react";
import type { RolUsuario } from "@/types/database";

export interface NavItem {
  label: string;
  href:  string;
  icon:  React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const NAV_ITEMS: Record<RolUsuario, NavItem[]> = {
  coordinador: [
    { label: "Dashboard",          href: "/dashboard",                icon: LayoutDashboard },
    { label: "Generar Horario",    href: "/dashboard/generar",        icon: Calendar },
    { label: "Configurar generación", href: "/dashboard/configuracion-horario", icon: SlidersHorizontal },
    { label: "Editar Horario",     href: "/dashboard/editar",         icon: Calendar },
    { label: "Consulta de Horarios", href: "/dashboard/horario",     icon: Eye },
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

const LABEL_ROL: Record<RolUsuario, string> = {
  coordinador:   "Coordinador",
  docente:       "Docente",
  administrador: "Administrador",
  apoyo:         "Personal Apoyo",
};

interface SidebarProps {
  nombre: string;
  rol: RolUsuario;
}

export function Sidebar({ nombre, rol }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[rol] ?? [];

  const iniciales = nombre
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside style={{
      width: 240,
      minHeight: "100vh",
      background: "#0E1116",
      color: "#F5F1E8",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      borderRight: "1px solid #1C2128",
    }}>

      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "20px 20px 18px",
        borderBottom: "1px solid color-mix(in oklab, #F5F1E8 10%, transparent)",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 7,
          background: "#F5F1E8", color: "#0E1116",
          display: "grid", placeItems: "center", flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2v2H8zM14 14h2v2h-2z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>SIGGHAS</div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "color-mix(in oklab, #F5F1E8 45%, transparent)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>PUCE · Software</div>
        </div>
      </div>

      {/* Perfil */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid color-mix(in oklab, #F5F1E8 10%, transparent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "#1D3FD9", color: "white",
            display: "grid", placeItems: "center",
            fontWeight: 600, fontSize: 12, flexShrink: 0,
            fontFamily: "JetBrains Mono, monospace",
          }}>
            {iniciales}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nombre}
            </div>
            <div style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 10,
              color: "color-mix(in oklab, #F5F1E8 50%, transparent)",
              letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2,
            }}>
              {LABEL_ROL[rol]}
            </div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8, marginBottom: 2,
                fontSize: 13.5, fontWeight: 500, textDecoration: "none",
                transition: "background .15s",
                background: isActive ? "color-mix(in oklab, #1D3FD9 80%, transparent)" : "transparent",
                color: isActive ? "#F5F1E8" : "color-mix(in oklab, #F5F1E8 65%, transparent)",
              }}
            >
              <Icon style={{ width: 15, height: 15, flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px", borderTop: "1px solid color-mix(in oklab, #F5F1E8 10%, transparent)" }}>
        <button
          type="button"
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 8, border: 0,
            background: "transparent", cursor: "pointer",
            fontSize: 13.5, fontWeight: 500,
            color: "color-mix(in oklab, #F5F1E8 45%, transparent)",
            fontFamily: "Poppins, sans-serif",
            transition: "background .15s, color .15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in oklab, #C8523B 25%, transparent)"; (e.currentTarget as HTMLButtonElement).style.color = "#F5F1E8"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "color-mix(in oklab, #F5F1E8 45%, transparent)"; }}
        >
          <LogOut style={{ width: 15, height: 15 }} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
