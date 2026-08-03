import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsuarioForm } from "@/components/entities/UsuarioForm";

const sedes = [{ id: "s-1", nombre: "Manta", es_central: true, creado_en: "" }];

describe("UsuarioForm", () => {
  it("incluye nombre y email cuando includeIdentityFields=true (crear)", () => {
    render(<UsuarioForm action={vi.fn()} sedes={sedes} />);
    expect(screen.getByLabelText(/nombre/i)).toBeTruthy();
    expect(screen.getByLabelText(/correo institucional/i)).toBeTruthy();
    expect((screen.getByLabelText(/^rol/i) as HTMLSelectElement).value).toBe("apoyo");
  });

  it("oculta nombre/email y muestra el checkbox de activo cuando includeIdentityFields=false (editar)", () => {
    render(<UsuarioForm action={vi.fn()} sedes={sedes} includeIdentityFields={false} value={{ rol: "coordinador", activo: false }} />);
    expect(screen.queryByLabelText(/correo institucional/i)).toBeNull();
    expect((screen.getByLabelText(/^rol/i) as HTMLSelectElement).value).toBe("coordinador");
    expect((screen.getByLabelText(/usuario activo/i) as HTMLInputElement).checked).toBe(false);
  });

  it("no permite seleccionar el rol docente, pero permite crear estudiantes", () => {
    render(<UsuarioForm action={vi.fn()} sedes={sedes} />);
    const select = screen.getByLabelText(/^rol/i) as HTMLSelectElement;
    const opciones = Array.from(select.options).map((o) => o.value);
    expect(opciones).not.toContain("docente");
    expect(opciones).toContain("estudiante");
  });
});
