import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/dashboard/editar/[horarioId]/actions", () => ({
  editarSesionManualAction: vi.fn(),
  eliminarSesionManualAction: vi.fn(),
}));

import { EditarSesionDialog } from "@/app/dashboard/editar/[horarioId]/EditarSesionDialog";
import type { OpcionesManuales } from "@/app/dashboard/editar/[horarioId]/NuevaSesionDialog";

const opciones: OpcionesManuales = {
  materias: [
    { id: "m-1", nombre: "Cálculo 1", semestre: 1, modalidad: "presencial" },
    { id: "m-5", nombre: "Programación I", semestre: 5, modalidad: "presencial" },
  ],
  cursos: [
    { id: "g-porto", nombre: "PORTO 1A", semestre: 1, sede_id: "sede-porto" },
    { id: "g-manta", nombre: "MANTA 1A", semestre: 1, sede_id: "sede-manta" },
    { id: "g-porto5", nombre: "PORTO 5A", semestre: 5, sede_id: "sede-porto" },
  ],
  docentes: [
    { id: "d-porto", nombre: "axelprofe01", sede_ids: ["sede-porto"] },
    { id: "d-manta", nombre: "profe manta", sede_ids: ["sede-manta"] },
    { id: "d-ambas", nombre: "profe ambas", sede_ids: ["sede-porto", "sede-manta"] },
  ],
  aulas: [
    { id: "e-porto", nombre: "Laboratorio general", sede_id: "sede-porto" },
    { id: "e-manta", nombre: "Aula Manta 101", sede_id: "sede-manta" },
  ],
};

const sesion = {
  id: "s-1",
  materia_id: "m-1",
  grupo_id: "g-porto",
  docente_id: "d-porto",
  espacio_id: "e-porto",
  dia_semana: 1,
  hora_inicio: "08:00",
  hora_fin: "10:00",
};

function opcionesDe(select: HTMLElement) {
  return within(select).getAllByRole("option").map((option) => option.textContent);
}

describe("EditarSesionDialog", () => {
  it("filtra materias por semestre y docentes/aulas por sede del curso", () => {
    render(
      <EditarSesionDialog horarioId="h-1" sesion={sesion} opciones={opciones} onClose={vi.fn()} />,
    );
    expect(opcionesDe(screen.getByLabelText(/materia/i))).toContain("Cálculo 1");
    expect(opcionesDe(screen.getByLabelText(/materia/i))).not.toContain("Programación I");

    expect(opcionesDe(screen.getByLabelText(/docente/i))).toContain("axelprofe01");
    expect(opcionesDe(screen.getByLabelText(/docente/i))).toContain("profe ambas");
    expect(opcionesDe(screen.getByLabelText(/docente/i))).not.toContain("profe manta");

    expect(opcionesDe(screen.getByLabelText(/aula/i))).toContain("Laboratorio general");
    expect(opcionesDe(screen.getByLabelText(/aula/i))).not.toContain("Aula Manta 101");
  });

  it("al cambiar de curso actualiza filtros y limpia valores inválidos", () => {
    render(
      <EditarSesionDialog horarioId="h-1" sesion={sesion} opciones={opciones} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText(/curso/i), { target: { value: "g-manta" } });

    expect(opcionesDe(screen.getByLabelText(/docente/i))).toContain("profe manta");
    expect(opcionesDe(screen.getByLabelText(/docente/i))).not.toContain("axelprofe01");
    expect((screen.getByLabelText(/docente/i) as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText(/aula/i) as HTMLSelectElement).value).toBe("");
  });

  it("al cambiar a un curso de otro semestre limpia la materia inválida", () => {
    render(
      <EditarSesionDialog horarioId="h-1" sesion={sesion} opciones={opciones} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText(/curso/i), { target: { value: "g-porto5" } });
    expect(opcionesDe(screen.getByLabelText(/materia/i))).toContain("Programación I");
    expect(opcionesDe(screen.getByLabelText(/materia/i))).not.toContain("Cálculo 1");
    expect((screen.getByLabelText(/materia/i) as HTMLSelectElement).value).toBe("");
  });
});
