import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "apoyo" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import DisponibilidadAulasPage from "@/app/dashboard/disponibilidad/page";
import DisponibilidadAulasPageReexport from "@/app/dashboard/espacios/disponibilidad/page";

describe("DisponibilidadAulasPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "apoyo" });
  });

  it("verifica el rol de apoyo y muestra el mapa de aulas", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "espacios") return createChainableQuery(ok([{ id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, sede_id: "s-1" }]));
      return createChainableQuery(ok(null));
    });
    const jsx = await DisponibilidadAulasPage();
    render(jsx);
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador", "apoyo");
    expect(screen.getByText("Disponibilidad semanal de aulas")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Buscar aula o laboratorio" })).toBeTruthy();
  });

  it("cruza las sesiones del horario activo cuando existen", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "espacios") return createChainableQuery(ok([{ id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, sede_id: "s-1" }]));
      if (table === "periodos") return createChainableQuery(ok({ id: "p-1", nombre: "2026-I" }));
      if (table === "horarios") return createChainableQuery(ok({ id: "h-1" }));
      if (table === "sesiones") return createChainableQuery(ok([{ id: "s-1", espacio_id: "e-1", dia_semana: 1, hora_inicio: "08:00", hora_fin: "09:00" }]));
      return createChainableQuery(ok(null));
    });
    const jsx = await DisponibilidadAulasPage();
    render(jsx);
    expect(screen.getByText("Disponibilidad semanal de aulas")).toBeTruthy();
  });

  it("el re-export de espacios/disponibilidad apunta a la misma página", () => {
    expect(DisponibilidadAulasPageReexport).toBe(DisponibilidadAulasPage);
  });
});
