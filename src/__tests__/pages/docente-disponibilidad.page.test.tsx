import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import DisponibilidadDocentePage from "@/app/dashboard/docentes/[id]/disponibilidad/page";

describe("DisponibilidadDocentePage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("muestra la grilla de disponibilidad del docente", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "docentes") return createChainableQuery(ok({ id: "d-1", perfiles: { nombre: "Ana Pérez", email: "ana@puce.edu.ec" } }));
      return createChainableQuery(ok([{ dia_semana: 1, hora_inicio: "08:00:00", hora_fin: "09:00:00", es_tiempo_oficina: false }]));
    });
    const jsx = await DisponibilidadDocentePage({ params: Promise.resolve({ id: "d-1" }) });
    render(jsx);
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador", "docente");
    expect(screen.getByText(/ana pérez/i)).toBeTruthy();
    expect(screen.getByText("Bloques disponibles")).toBeTruthy();
  });

  it("responde 404 si el docente no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(DisponibilidadDocentePage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
