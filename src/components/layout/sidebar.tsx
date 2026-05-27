"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import type { RolUsuario } from "@/types/database";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const LABEL_ROL: Record<RolUsuario, string> = {
  coordinador:   "Coordinador",
  docente:       "Docente",
  estudiante:    "Estudiante",
  administrador: "Administrador",
  apoyo:         "Personal Apoyo",
};

const COLOR_ROL: Record<RolUsuario, string> = {
  coordinador:   "bg-indigo-100 text-indigo-700",
  docente:       "bg-emerald-100 text-emerald-700",
  estudiante:    "bg-blue-100 text-blue-700",
  administrador: "bg-orange-100 text-orange-700",
  apoyo:         "bg-gray-100 text-gray-700",
};

interface SidebarProps {
  nombre: string;
  rol: RolUsuario;
}

export function Sidebar({ nombre, rol }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[rol] ?? [];

  const initiales = nombre
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-none">SIGGHAS</p>
          <p className="text-[10px] text-gray-400 mt-0.5">PUCE · Software</p>
        </div>
      </div>

      {/* Perfil */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {initiales}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{nombre}</p>
            <Badge variant="secondary" className={cn("text-[10px] mt-0.5 font-medium px-1.5 py-0", COLOR_ROL[rol])}>
              {LABEL_ROL[rol]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-600" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-100">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
