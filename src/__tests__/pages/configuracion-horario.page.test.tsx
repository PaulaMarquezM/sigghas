import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import ConfiguracionHorarioPage from "@/app/dashboard/configuracion-horario/page";

function makeQuery(data: unknown) {
  const query: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order"]) query[m] = vi.fn(() => query);
  query.then = (resolve: (v: unknown) => unknown) => resolve({ data, error: null });
  return query;
}

describe("ConfiguracionHorarioPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("avisa si no hay periodo activo", async () => {
    fromMock.mockReturnValue(makeQuery([]));
    const jsx = await ConfiguracionHorarioPage();
    render(jsx);
    expect(screen.getByText(/activa un período académico/i)).toBeTruthy();
  });

  it("muestra los pasos de asignación de docentes y disponibilidad de aulas con un periodo activo", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return makeQuery([{ id: "p-1", nombre: "2026-I" }]);
      if (table === "materias") return makeQuery([{ id: "m-1", codigo: "SW-01", nombre: "Programación I", semestre: 5 }]);
      if (table === "grupos") return makeQuery([{ id: "g-1", nombre: "SW-5A", semestre: 5 }]);
      if (table === "docentes") return makeQuery([{ id: "d-1", perfiles: { nombre: "Ana Pérez" } }]);
      if (table === "espacios") return makeQuery([{ id: "e-1", nombre: "Aula 101" }]);
      if (table === "asignaciones_docente_periodo") return makeQuery([{ periodo_id: "p-1", materia_id: "m-1", grupo_id: "g-1", materias: { nombre: "Programación I" }, grupos: { nombre: "SW-5A" }, docentes: { perfiles: { nombre: "Ana Pérez" } } }]);
      return makeQuery([{ id: "b-1", espacio_id: "e-1", dia_semana: 1, hora_inicio: "08:00:00", hora_fin: "17:00:00", disponible: true, espacios: { nombre: "Aula 101" } }]);
    });
    const jsx = await ConfiguracionHorarioPage();
    render(jsx);
    expect(screen.getByText("Asignar docente a materia y curso")).toBeTruthy();
    expect(screen.getByText("Disponibilidad de aulas")).toBeTruthy();
    expect(screen.getAllByText("Ana Pérez").length).toBeGreaterThan(0);
  });
});
