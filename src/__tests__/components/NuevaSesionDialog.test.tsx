import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/dashboard/editar/[horarioId]/actions", () => ({ crearSesionManualAction: vi.fn() }));

import { NuevaSesionDialog, type OpcionesManuales } from "@/app/dashboard/editar/[horarioId]/NuevaSesionDialog";

const opciones: OpcionesManuales = {
  materias: [{ id: "m-1", nombre: "Programación I", semestre: 5, modalidad: "presencial" }],
  cursos: [{ id: "g-1", nombre: "SW-5A", semestre: 5, sede_id: "s-1" }],
  docentes: [{ id: "d-1", nombre: "Ana Pérez" }],
  aulas: [{ id: "e-1", nombre: "Aula 101", sede_id: "s-1" }],
};

describe("NuevaSesionDialog", () => {
  it("el diálogo empieza cerrado y se abre al hacer clic en 'Agregar clase'", () => {
    render(<NuevaSesionDialog horarioId="h-1" opciones={opciones} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /agregar clase/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("SW-5A")).toBeTruthy();
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
  });

  it("se cierra con el botón Cancelar", () => {
    render(<NuevaSesionDialog horarioId="h-1" opciones={opciones} />);
    fireEvent.click(screen.getByRole("button", { name: /agregar clase/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
