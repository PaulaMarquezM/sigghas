import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const getSessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: () => getSessionMock() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }),
}));

import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage (home)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({ select: vi.fn().mockResolvedValue({ count: 3, data: null, error: null }) });
  });

  it("no renderiza nada si no hay perfil (el layout redirige)", async () => {
    getSessionMock.mockResolvedValue({ perfil: null });
    const jsx = await DashboardPage();
    expect(jsx).toBeNull();
  });

  it("un coordinador ve las estadísticas y sus accesos rápidos", async () => {
    getSessionMock.mockResolvedValue({ perfil: { nombre: "Ana Pérez", rol: "coordinador" } });
    const jsx = await DashboardPage();
    render(jsx);
    expect(screen.getByText("Ana.")).toBeTruthy();
    expect(screen.getByText("Generar Horario")).toBeTruthy();
    expect(screen.getByText("Gestionar Cursos")).toBeTruthy();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("un docente ve sus accesos rápidos sin estadísticas generales", async () => {
    getSessionMock.mockResolvedValue({ perfil: { nombre: "Luis Ruiz", rol: "docente" } });
    const jsx = await DashboardPage();
    render(jsx);
    expect(screen.getByText("Ver mi Horario")).toBeTruthy();
    expect(screen.getByText("Exportar PDF")).toBeTruthy();
    expect(screen.queryByText("Generar Horario")).toBeNull();
  });

  it("un usuario de apoyo ve el acceso a disponibilidad de aulas", async () => {
    getSessionMock.mockResolvedValue({ perfil: { nombre: "Carla", rol: "apoyo" } });
    const jsx = await DashboardPage();
    render(jsx);
    expect(screen.getByText("Disponibilidad de Aulas")).toBeTruthy();
  });
});
