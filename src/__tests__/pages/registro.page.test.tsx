import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let searchParamsValue = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParamsValue }));

import RegisterPage from "@/app/registro/page";

describe("RegisterPage", () => {
  beforeEach(() => {
    searchParamsValue = new URLSearchParams();
  });

  it("renderiza el formulario con docente seleccionado por defecto", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/nombre completo/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^docente/i }).getAttribute("aria-pressed")).toBe("true");
  });

  it("cambia el rol a coordinador al hacer clic", () => {
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole("button", { name: /coordinador/i }));
    expect(screen.getByRole("button", { name: /coordinador/i }).getAttribute("aria-pressed")).toBe("true");
  });

  it("alterna mostrar/ocultar contraseña", () => {
    render(<RegisterPage />);
    const password = screen.getByLabelText("Contraseña") as HTMLInputElement;
    expect(password.type).toBe("password");
    fireEvent.click(screen.getByLabelText(/mostrar contraseña/i));
    expect(password.type).toBe("text");
  });

  it("muestra el mensaje de error de la URL", () => {
    searchParamsValue = new URLSearchParams("error=Este%20correo%20ya%20tiene%20una%20cuenta.");
    render(<RegisterPage />);
    expect(screen.getByText("Este correo ya tiene una cuenta.")).toBeTruthy();
  });
});
