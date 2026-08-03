import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type TableColumn } from "@/components/entities/DataTable";

type Fila = { id: string; nombre: string };

const columns: TableColumn<Fila>[] = [
  { key: "nombre", header: "Nombre", cell: (row) => row.nombre },
];

describe("DataTable", () => {
  it("muestra el título, la descripción y el botón de crear cuando createHref existe", () => {
    render(<DataTable title="Materias" description="Administra materias." createHref="/dashboard/materias/nuevo" rows={[]} columns={columns} />);
    expect(screen.getByText("Materias")).toBeTruthy();
    expect(screen.getByText("Administra materias.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /nuevo/i }).getAttribute("href")).toBe("/dashboard/materias/nuevo");
  });

  it("no muestra el botón de crear cuando no se pasa createHref", () => {
    render(<DataTable title="Materias" description="x" rows={[]} columns={columns} />);
    expect(screen.queryByRole("link", { name: /nuevo/i })).toBeNull();
  });

  it("muestra el texto vacío cuando no hay filas", () => {
    render(<DataTable title="Materias" description="x" rows={[]} columns={columns} emptyText="Sin materias." />);
    expect(screen.getByText("Sin materias.")).toBeTruthy();
  });

  it("renderiza una fila por elemento y el contador de registros", () => {
    const rows: Fila[] = [{ id: "1", nombre: "Programación I" }, { id: "2", nombre: "Cálculo" }];
    render(<DataTable title="Materias" description="x" rows={rows} columns={columns} />);
    expect(screen.getByText("Programación I")).toBeTruthy();
    expect(screen.getByText("Cálculo")).toBeTruthy();
    expect(screen.getByText("2 registros")).toBeTruthy();
  });

  it("usa singular en el contador cuando hay una sola fila", () => {
    render(<DataTable title="Materias" description="x" rows={[{ id: "1", nombre: "Programación I" }]} columns={columns} />);
    expect(screen.getByText("1 registro")).toBeTruthy();
  });

  it("precarga el valor de búsqueda existente", () => {
    render(<DataTable title="Materias" description="x" rows={[]} columns={columns} searchDefault="prog" />);
    expect((screen.getByPlaceholderText("Buscar...") as HTMLInputElement).value).toBe("prog");
  });
});
