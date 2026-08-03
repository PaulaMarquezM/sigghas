import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MateriaForm } from "@/components/entities/MateriaForm";

describe("MateriaForm", () => {
  it("renderiza todos los campos con sus valores por defecto", () => {
    render(<MateriaForm action={vi.fn()} />);
    expect((screen.getByLabelText(/nombre/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/nivel/i) as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText(/modalidad/i) as HTMLSelectElement).value).toBe("presencial");
    expect((screen.getByLabelText(/horas teoría/i) as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText(/horas práctica/i) as HTMLInputElement).value).toBe("0");
    expect((screen.getByLabelText(/materia activa/i) as HTMLInputElement).checked).toBe(true);
  });

  it("precarga los valores existentes al editar", () => {
    render(
      <MateriaForm
        action={vi.fn()}
        value={{ codigo: "SW-101", nombre: "Programación I", nivel: 3, horas_teoria: 2, horas_practica: 1, modalidad: "hibrida", requiere_laboratorio: true }}
      />
    );
    expect((screen.getByLabelText(/código/i) as HTMLInputElement).value).toBe("SW-101");
    expect((screen.getByLabelText(/^nombre/i) as HTMLInputElement).value).toBe("Programación I");
    expect((screen.getByLabelText(/modalidad/i) as HTMLSelectElement).value).toBe("hibrida");
    expect((screen.getByLabelText(/requiere laboratorio/i) as HTMLInputElement).checked).toBe(true);
  });
});
