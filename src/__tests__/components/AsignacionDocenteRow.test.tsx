import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/app/dashboard/configuracion-horario/actions", () => ({
  actualizarAsignacionDocente: vi.fn(),
  eliminarAsignacionDocente: vi.fn(),
}));

import { AsignacionDocenteRow } from "@/app/dashboard/configuracion-horario/AsignacionDocenteRow";

const docentes = [
  { id: "d-1", nombre: "Ana Pérez" },
  { id: "d-2", nombre: "Luis Gómez" },
];

function renderRow() {
  return render(
    <table>
      <tbody>
        <AsignacionDocenteRow
          row={{
            periodoId: "p-1",
            materiaId: "m-1",
            grupoId: "g-1",
            docenteId: "d-1",
            materiaNombre: "Programación I",
            cursoNombre: "SW-5A",
            docenteNombre: "Ana Pérez",
          }}
          docentes={docentes}
        />
      </tbody>
    </table>
  );
}

describe("AsignacionDocenteRow", () => {
  it("muestra la asignación en modo lectura con los botones Editar y Quitar", () => {
    renderRow();
    expect(screen.getByText("Programación I")).toBeTruthy();
    expect(screen.getByText("SW-5A")).toBeTruthy();
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quitar" })).toBeTruthy();
  });

  it("al hacer clic en Editar muestra el select de docentes precargado", () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.name).toBe("docente_id");
    expect(select.value).toBe("d-1");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
  });

  it("Cancelar vuelve al modo lectura sin guardar", () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
