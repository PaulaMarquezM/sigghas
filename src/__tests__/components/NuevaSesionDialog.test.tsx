import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/dashboard/editar/[horarioId]/actions", () => ({ crearSesionManualAction: vi.fn() }));

import { NuevaSesionDialog, type OpcionesManuales } from "@/app/dashboard/editar/[horarioId]/NuevaSesionDialog";

const opciones: OpcionesManuales = {
  materias: [{ id: "m-1", nombre: "Programación I", semestre: 5, modalidad: "presencial" }],
  cursos: [{ id: "g-1", nombre: "SW-5A", semestre: 5, sede_id: "s-1" }],
  docentes: [
    { id: "d-1", nombre: "Ana Pérez", sede_ids: ["s-1"] },
    { id: "d-2", nombre: "Luis otra sede", sede_ids: ["s-2"] },
  ],
  aulas: [
    { id: "e-1", nombre: "Aula 101", sede_id: "s-1" },
    { id: "e-2", nombre: "Aula otra sede", sede_id: "s-2" },
  ],
  sedes: [
    { id: "s-1", nombre: "Portoviejo" },
    { id: "s-2", nombre: "Manta" },
  ],
};

function opcionesDe(select: HTMLElement) {
  return within(select).getAllByRole("option").map((option) => option.textContent);
}

describe("NuevaSesionDialog", () => {
  it("el diálogo empieza cerrado y se abre al hacer clic en 'Agregar clase'", () => {
    render(<NuevaSesionDialog horarioId="h-1" opciones={opciones} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /agregar clase/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("SW-5A")).toBeTruthy();
  });

  it("preselecciona el curso del filtro activo al abrir", () => {
    const opcionesVarias: OpcionesManuales = {
      ...opciones,
      cursos: [
        { id: "g-1", nombre: "SW-5A", semestre: 5, sede_id: "s-1" },
        { id: "g-2", nombre: "SW-1A", semestre: 1, sede_id: "s-1" },
      ],
      materias: [
        ...opciones.materias,
        { id: "m-2", nombre: "Programación Intro", semestre: 1, modalidad: "presencial" },
      ],
    };
    render(<NuevaSesionDialog horarioId="h-1" opciones={opcionesVarias} grupoIdInicial="g-2" />);
    fireEvent.click(screen.getByRole("button", { name: /agregar clase/i }));
    expect((screen.getByLabelText(/curso/i) as HTMLSelectElement).value).toBe("g-2");
    expect((screen.getByLabelText(/semestre/i) as HTMLSelectElement).value).toBe("1");
  });

  it("filtra materias por semestre y docentes/aulas por sede del curso", () => {
    render(<NuevaSesionDialog horarioId="h-1" opciones={opciones} grupoIdInicial="g-1" />);
    fireEvent.click(screen.getByRole("button", { name: /agregar clase/i }));

    expect(opcionesDe(screen.getByLabelText(/materia/i))).toContain("Programación I");
    expect(opcionesDe(screen.getByLabelText(/docente/i))).toContain("Ana Pérez");
    expect(opcionesDe(screen.getByLabelText(/docente/i))).not.toContain("Luis otra sede");
    expect(opcionesDe(screen.getByLabelText(/aula/i))).toContain("Aula 101");
    expect(opcionesDe(screen.getByLabelText(/aula/i))).not.toContain("Aula otra sede");
  });

  it("se cierra con el botón Cancelar", () => {
    render(<NuevaSesionDialog horarioId="h-1" opciones={opciones} />);
    fireEvent.click(screen.getByRole("button", { name: /agregar clase/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
