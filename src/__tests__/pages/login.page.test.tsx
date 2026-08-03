import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let searchParamsValue = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParamsValue }));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    searchParamsValue = new URLSearchParams();
  });

  it("renderiza el formulario con coordinador seleccionado por defecto", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/correo institucional/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /coordinador/i }).getAttribute("aria-pressed")).toBe("true");
  });

  it("cambia el rol seleccionado al hacer clic en Docente", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /docente/i }));
    expect(screen.getByRole("button", { name: /docente/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /^coordinador/i }).getAttribute("aria-pressed")).toBe("false");
  });

  it("alterna mostrar/ocultar contraseña", () => {
    render(<LoginPage />);
    const password = screen.getByLabelText("Contraseña") as HTMLInputElement;
    expect(password.type).toBe("password");
    fireEvent.click(screen.getByLabelText(/mostrar contraseña/i));
    expect(password.type).toBe("text");
  });

  it("muestra el mensaje de error de la URL", () => {
    searchParamsValue = new URLSearchParams("error=Correo%20o%20contrase%C3%B1a%20incorrectos.");
    render(<LoginPage />);
    expect(screen.getByText("Correo o contraseña incorrectos.")).toBeTruthy();
  });

  it("muestra el mensaje informativo de la URL", () => {
    searchParamsValue = new URLSearchParams("msg=Cuenta%20creada.");
    render(<LoginPage />);
    expect(screen.getByText("Cuenta creada.")).toBeTruthy();
  });
});
