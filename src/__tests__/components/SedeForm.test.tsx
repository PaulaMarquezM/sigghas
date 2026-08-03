import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SedeForm } from "@/components/entities/SedeForm";

describe("SedeForm", () => {
  it("renderiza el campo nombre y el checkbox de sede central", () => {
    render(<SedeForm action={vi.fn()} />);
    expect(screen.getByLabelText(/nombre/i)).toBeTruthy();
    expect(screen.getByLabelText(/sede central/i)).toBeTruthy();
  });

  it("precarga los valores existentes al editar", () => {
    render(<SedeForm action={vi.fn()} value={{ nombre: "Manta", es_central: true }} cancelHref="/dashboard/sedes" />);
    const nombre = screen.getByLabelText(/nombre/i) as HTMLInputElement;
    const central = screen.getByLabelText(/sede central/i) as HTMLInputElement;
    expect(nombre.value).toBe("Manta");
    expect(central.checked).toBe(true);
  });
});
