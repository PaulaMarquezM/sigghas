import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormShell, FormActions, FormMessage, Field, NativeSelect } from "@/components/entities/FormShell";

describe("FormShell", () => {
  it("muestra el título y el enlace de volver", () => {
    render(<FormShell title="Nueva materia" backHref="/dashboard/materias">contenido</FormShell>);
    expect(screen.getByText("Nueva materia")).toBeTruthy();
    expect(screen.getByRole("link", { name: /volver/i }).getAttribute("href")).toBe("/dashboard/materias");
    expect(screen.getByText("contenido")).toBeTruthy();
  });
});

describe("FormActions", () => {
  it("muestra los botones Cancelar y Guardar", () => {
    render(<FormActions cancelHref="/dashboard/materias" />);
    expect(screen.getByRole("link", { name: /cancelar/i }).getAttribute("href")).toBe("/dashboard/materias");
    expect(screen.getByRole("button", { name: /guardar/i })).toBeTruthy();
  });
});

describe("FormMessage", () => {
  it("no renderiza nada si no hay mensaje", () => {
    const { container } = render(<FormMessage />);
    expect(container.innerHTML).toBe("");
  });

  it("muestra el mensaje de error cuando existe", () => {
    render(<FormMessage message="El nombre es obligatorio." />);
    expect(screen.getByRole("alert").textContent).toContain("El nombre es obligatorio.");
  });
});

describe("Field", () => {
  it("marca el campo como obligatorio por defecto", () => {
    render(
      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" />
      </Field>
    );
    expect(screen.getByLabelText(/obligatorio/i)).toBeTruthy();
  });

  it("muestra '(opcional)' cuando required=false", () => {
    render(
      <Field label="Nota" htmlFor="nota" required={false}>
        <input id="nota" />
      </Field>
    );
    expect(screen.getByText("(opcional)")).toBeTruthy();
  });

  it("muestra el hint cuando se provee", () => {
    render(
      <Field label="Número" htmlFor="numero" hint="Ej. 204">
        <input id="numero" />
      </Field>
    );
    expect(screen.getByText("Ej. 204")).toBeTruthy();
  });
});

describe("NativeSelect", () => {
  it("renderiza sus opciones y respeta el valor por defecto", () => {
    render(
      <NativeSelect id="tipo" name="tipo" defaultValue="laboratorio">
        <option value="aula">Aula</option>
        <option value="laboratorio">Laboratorio</option>
      </NativeSelect>
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("laboratorio");
  });
});
