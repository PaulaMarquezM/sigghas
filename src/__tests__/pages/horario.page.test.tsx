import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(), requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import HorarioConsultasPage from "@/app/dashboard/horario/page";

describe("HorarioConsultasPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok([{ id: "p-1", nombre: "2026-I", activo: true }]));
      if (table === "grupos") return createChainableQuery(ok([{ id: "g-1", nombre: "SW-5A", semestre: 5 }]));
      return createChainableQuery(ok([{ id: "d-1", nombre: "Ana Pérez" }]));
    });
  });

  it("verifica el rol y muestra el título de la página", async () => {
    const jsx = await HorarioConsultasPage();
    render(jsx);
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador");
    expect(screen.getByText("Consulta de Horarios")).toBeTruthy();
  });
});
