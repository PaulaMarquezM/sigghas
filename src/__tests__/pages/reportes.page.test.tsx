import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const getSessionMock = vi.fn();
const requireRolMock = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: () => getSessionMock(), requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

import ReportesRedirectPage from "@/app/dashboard/reportes/page";
import { render, screen } from "@testing-library/react";

describe("ReportesRedirectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("un docente va directo a su PDF", async () => {
    getSessionMock.mockResolvedValue({ perfil: { rol: "docente" } });
    await expect(ReportesRedirectPage()).rejects.toThrow("NEXT_REDIRECT:/api/pdf/mi-horario");
  });

  it("un coordinador ve el módulo de reportes", async () => {
    getSessionMock.mockResolvedValue({ perfil: { rol: "coordinador" } });
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(ReportesRedirectPage()).resolves.toBeTruthy();
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador");
  });

  it("muestra cuántos cursos ya tienen horario y sus horas", async () => {
    getSessionMock.mockResolvedValue({ perfil: { rol: "coordinador" } });
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok({ id: "p-1", nombre: "2027-OCT-FEB" }));
      if (table === "horarios") return createChainableQuery(ok([{ id: "h-1", estado: "publicado" }]));
      if (table === "sesiones") return createChainableQuery(ok([
        { docente_id: "d-1", espacio_id: "e-1", grupo_id: "g-1", hora_inicio: "08:00", hora_fin: "10:00", docentes: { perfiles: { nombre: "Ana" } }, espacios: { nombre: "Aula 101" }, grupos: { nombre: "MANTA A" } },
        { docente_id: "d-2", espacio_id: "e-2", grupo_id: "g-2", hora_inicio: "09:00", hora_fin: "10:00", docentes: { perfiles: { nombre: "Luis" } }, espacios: { nombre: "Lab-B" }, grupos: { nombre: "PORTOVIEJO A" } },
      ]));
      return createChainableQuery(ok(null));
    });

    render(await ReportesRedirectPage());
    expect(screen.getByText("Cursos con horario configurado")).toBeTruthy();
    expect(screen.getByText("Horarios por curso")).toBeTruthy();
    expect(screen.getByText("MANTA A")).toBeTruthy();
    expect(screen.getByText("PORTOVIEJO A")).toBeTruthy();
  });
});
