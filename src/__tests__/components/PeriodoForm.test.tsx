import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PeriodoForm } from "@/components/entities/PeriodoForm";

describe("PeriodoForm", () => {
  it("renderiza nombre, fechas y el checkbox de activo (apagado por defecto)", () => {
    render(<PeriodoForm action={vi.fn()} />);
    expect(screen.getByLabelText(/nombre/i)).toBeTruthy();
    expect(screen.getByLabelText(/fecha de inicio/i)).toBeTruthy();
    expect(screen.getByLabelText(/fecha de fin/i)).toBeTruthy();
    expect((screen.getByLabelText(/periodo activo/i) as HTMLInputElement).checked).toBe(false);
  });

  it("precarga los valores existentes al editar", () => {
    render(<PeriodoForm action={vi.fn()} value={{ nombre: "2026-I", fecha_inicio: "2026-01-05", fecha_fin: "2026-06-30", activo: true }} />);
    expect((screen.getByLabelText(/nombre/i) as HTMLInputElement).value).toBe("2026-I");
    expect((screen.getByLabelText(/fecha de inicio/i) as HTMLInputElement).value).toBe("2026-01-05");
    expect((screen.getByLabelText(/periodo activo/i) as HTMLInputElement).checked).toBe(true);
  });
});
