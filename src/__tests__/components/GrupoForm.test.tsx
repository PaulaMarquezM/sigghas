import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GrupoForm } from "@/components/entities/GrupoForm";

const sedes = [
  { id: "s-1", nombre: "Manta", es_central: true, creado_en: "" },
  { id: "s-2", nombre: "Portoviejo", es_central: false, creado_en: "" },
];

describe("GrupoForm", () => {
  it("lista las sedes disponibles en el select", () => {
    render(<GrupoForm action={vi.fn()} sedes={sedes} />);
    const select = screen.getByLabelText(/sede/i) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(["Seleccionar", "Manta", "Portoviejo"]);
  });

  it("precarga los valores existentes al editar", () => {
    render(<GrupoForm action={vi.fn()} sedes={sedes} value={{ nombre: "SW-5A", sede_id: "s-2", semestre: 5, cantidad_estudiantes: 25 }} />);
    expect((screen.getByLabelText(/^nombre/i) as HTMLInputElement).value).toBe("SW-5A");
    expect((screen.getByLabelText(/sede/i) as HTMLSelectElement).value).toBe("s-2");
    expect((screen.getByLabelText(/semestre/i) as HTMLInputElement).value).toBe("5");
    expect((screen.getByLabelText(/cantidad de estudiantes/i) as HTMLInputElement).value).toBe("25");
  });
});
