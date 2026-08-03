import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EspacioForm } from "@/components/entities/EspacioForm";

const sedes = [{ id: "s-1", nombre: "Manta", es_central: true, creado_en: "" }];

describe("EspacioForm", () => {
  it("renderiza número, tipo, capacidad y sede con sus valores por defecto", () => {
    render(<EspacioForm action={vi.fn()} sedes={sedes} />);
    expect((screen.getByLabelText(/número/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/tipo de aula/i) as HTMLSelectElement).value).toBe("aula");
    expect((screen.getByLabelText(/capacidad/i) as HTMLInputElement).value).toBe("30");
    expect((screen.getByLabelText(/tiene internet/i) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/activa y disponible/i) as HTMLInputElement).checked).toBe(true);
  });

  it("extrae el número desde el nombre existente al editar", () => {
    render(<EspacioForm action={vi.fn()} sedes={sedes} value={{ nombre: "Aula 204", tipo: "aula", capacidad: 35, sede_id: "s-1" }} />);
    expect((screen.getByLabelText(/número/i) as HTMLInputElement).value).toBe("204");
    expect((screen.getByLabelText(/capacidad/i) as HTMLInputElement).value).toBe("35");
  });
});
