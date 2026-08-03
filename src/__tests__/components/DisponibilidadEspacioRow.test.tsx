import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/app/dashboard/configuracion-horario/actions", () => ({
  actualizarDisponibilidadEspacio: vi.fn(),
  eliminarDisponibilidadEspacio: vi.fn(),
}));

import { DisponibilidadEspacioRow } from "@/app/dashboard/configuracion-horario/DisponibilidadEspacioRow";

function renderRow() {
  return render(
    <table>
      <tbody>
        <DisponibilidadEspacioRow
          row={{ id: "b-1", espacioNombre: "Aula 204", dia_semana: 2, hora_inicio: "08:00:00", hora_fin: "10:00:00", disponible: true }}
        />
      </tbody>
    </table>
  );
}

describe("DisponibilidadEspacioRow", () => {
  it("muestra la franja en modo lectura con los botones Editar y Quitar", () => {
    renderRow();
    expect(screen.getByText("Aula 204")).toBeTruthy();
    expect(screen.getByText("Martes")).toBeTruthy();
    expect(screen.getByText("08:00–10:00")).toBeTruthy();
    expect(screen.getByText("Disponible")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quitar" })).toBeTruthy();
  });

  it("al hacer clic en Editar muestra los campos con los valores actuales precargados", () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect((screen.getByDisplayValue("08:00") as HTMLInputElement).name).toBe("hora_inicio");
    expect((screen.getByDisplayValue("10:00") as HTMLInputElement).name).toBe("hora_fin");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("2");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  });

  it("Cancelar vuelve al modo lectura sin guardar", () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
