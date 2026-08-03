import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const getSessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: () => getSessionMock() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import MiHorarioPage from "@/app/dashboard/mi-horario/page";

const periodoActivo = { id: "p-1", nombre: "2026-I", activo: true };
const horarioPublicado = { id: "h-1", estado: "publicado", generado_en: "2026-03-01" };

describe("MiHorarioPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("avisa si no hay periodo activo", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "d-1" }, perfil: { id: "d-1", rol: "docente", nombre: "Ana" } });
    fromMock.mockImplementation((table: string) => (table === "periodos" ? createChainableQuery(ok(null)) : createChainableQuery(ok([]))));
    const jsx = await MiHorarioPage();
    render(jsx);
    expect(screen.getByText(/no hay un periodo académico activo/i)).toBeTruthy();
  });

  it("avisa si no hay ningún horario para el periodo activo", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "d-1" }, perfil: { id: "d-1", rol: "docente", nombre: "Ana" } });
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok(periodoActivo));
      return createChainableQuery(ok([]));
    });
    const jsx = await MiHorarioPage();
    render(jsx);
    expect(screen.getByText(/no se ha generado ningún horario/i)).toBeTruthy();
  });

  it("un docente con clases ve su horario y el botón de descargar PDF", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "d-1" }, perfil: { id: "d-1", rol: "docente", nombre: "Ana Pérez" } });
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok(periodoActivo));
      if (table === "horarios") return createChainableQuery(ok([horarioPublicado]));
      if (table === "sesiones") return createChainableQuery(ok([{ id: "s-1", dia_semana: 1, hora_inicio: "09:00", hora_fin: "10:00" }]));
      return createChainableQuery(ok([]));
    });
    const jsx = await MiHorarioPage();
    render(jsx);
    expect(screen.getByText("Mi Horario de Clases")).toBeTruthy();
    expect(screen.getByRole("link", { name: /descargar pdf/i }).getAttribute("href")).toBe("/api/pdf/mi-horario");
  });

  it("un docente sin clases ve el mensaje correspondiente", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "d-1" }, perfil: { id: "d-1", rol: "docente", nombre: "Ana" } });
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok(periodoActivo));
      if (table === "horarios") return createChainableQuery(ok([horarioPublicado]));
      if (table === "sesiones") return createChainableQuery(ok([]));
      return createChainableQuery(ok([]));
    });
    const jsx = await MiHorarioPage();
    render(jsx);
    expect(screen.getByText(/no tienes clases programadas/i)).toBeTruthy();
  });

  it("un coordinador ve el mensaje de que esta vista es solo para docentes", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "c-1" }, perfil: { id: "c-1", rol: "coordinador", nombre: "Coord" } });
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok(periodoActivo));
      if (table === "horarios") return createChainableQuery(ok([horarioPublicado]));
      return createChainableQuery(ok([]));
    });
    const jsx = await MiHorarioPage();
    render(jsx);
    expect(screen.getByText(/esta vista es solo para docentes/i)).toBeTruthy();
  });
});
