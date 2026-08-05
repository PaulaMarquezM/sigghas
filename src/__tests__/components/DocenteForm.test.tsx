import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DocenteForm } from "@/components/entities/DocenteForm";

const sedes = [{ id: "s-1", nombre: "Manta", es_central: true, creado_en: "" }];

describe("DocenteForm", () => {
  it("incluye nombre y email al crear", () => {
    render(<DocenteForm action={vi.fn()} sedes={sedes} />);
    expect(screen.getByLabelText(/nombre/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect((screen.getByLabelText(/horas máximas semanales/i) as HTMLInputElement).value).toBe("20");
  });

  it("oculta identidad y muestra el checkbox de activo al editar", () => {
    render(<DocenteForm action={vi.fn()} sedes={sedes} includeIdentityFields={false} value={{ tipo_contrato: "titular", max_horas_semana: 30, activo: false }} />);
    expect(screen.queryByLabelText(/email/i)).toBeNull();
    expect((screen.getByLabelText(/tipo de contrato/i) as HTMLSelectElement).value).toBe("titular");
    expect((screen.getByLabelText(/docente activo/i) as HTMLInputElement).checked).toBe(false);
  });

  it("asigna una carga mÃ­nima de 40 horas al seleccionar tiempo completo", () => {
    render(<DocenteForm action={vi.fn()} sedes={sedes} />);
    fireEvent.change(screen.getByLabelText(/tipo de contrato/i), { target: { value: "tiempo_completo" } });
    expect((screen.getByRole("spinbutton", { name: /horas/i }) as HTMLInputElement).value).toBe("40");
  });
});
