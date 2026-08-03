import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
const getSessionMock = vi.fn().mockResolvedValue({ user: { id: "u-1" }, perfil: { id: "u-1", rol: "coordinador" } });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args), getSession: () => getSessionMock() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import GrupoHorarioPage from "@/app/dashboard/horario/[grupoId]/page";

describe("GrupoHorarioPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    getSessionMock.mockResolvedValue({ user: { id: "u-1" }, perfil: { id: "u-1", rol: "coordinador" } });
  });

  it("avisa si no hay periodo activo", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    const jsx = await GrupoHorarioPage({ params: Promise.resolve({ grupoId: "g-1" }) });
    render(jsx);
    expect(screen.getByText(/no hay un periodo académico activo/i)).toBeTruthy();
  });

  it("responde 404 si el grupo no existe", async () => {
    fromMock.mockImplementation((table: string) =>
      table === "periodos" ? createChainableQuery(ok({ id: "p-1", nombre: "2026-I" })) : createChainableQuery(ok(null))
    );
    await expect(GrupoHorarioPage({ params: Promise.resolve({ grupoId: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("muestra el horario del grupo cuando tiene clases asignadas", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok({ id: "p-1", nombre: "2026-I" }));
      if (table === "grupos") return createChainableQuery(ok({ id: "g-1", nombre: "SW-5A", semestre: 5 }));
      if (table === "horarios") return createChainableQuery(ok([{ id: "h-1", estado: "borrador" }]));
      if (table === "sesiones") return createChainableQuery(ok([{ id: "s-1", dia_semana: 1, hora_inicio: "09:00", hora_fin: "10:00" }]));
      return createChainableQuery(ok([]));
    });
    const jsx = await GrupoHorarioPage({ params: Promise.resolve({ grupoId: "g-1" }) });
    render(jsx);
    expect(screen.getByText("Horario del Curso: SW-5A")).toBeTruthy();
    expect(screen.getByRole("link", { name: /editar horario/i })).toBeTruthy();
  });
});
