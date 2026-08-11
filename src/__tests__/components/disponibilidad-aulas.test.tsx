import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { DisponibilidadAulas } from "@/components/horario/DisponibilidadAulas";

const espacios = [
  { id: "aula-101", nombre: "Aula 101", tipo: "aula", capacidad: 30, accesible: true },
  { id: "lab-a", nombre: "Lab-A", tipo: "laboratorio", capacidad: 24, accesible: false },
];

describe("DisponibilidadAulas", () => {
  it("cambia el aula desde un único selector y muestra automáticamente su estado semanal", () => {
    render(
      <DisponibilidadAulas
        espacios={espacios}
        sesiones={[
          {
            espacio_id: "lab-a",
            dia_semana: 2,
            hora_inicio: "08:00",
            hora_fin: "09:00",
            materias: { nombre: "Base de Datos" },
            grupos: { nombre: "SW-5A" },
          },
        ]}
        disponibilidad={[
          {
            espacio_id: "lab-a",
            dia_semana: 1,
            hora_inicio: "09:00",
            hora_fin: "09:30",
            disponible: false,
          },
        ]}
        periodoNombre="2026-I"
      />,
    );

    const selector = screen.getByRole("combobox", { name: "Buscar aula o laboratorio" });
    expect((selector as HTMLSelectElement).value).toBe("aula-101");
    fireEvent.change(selector, { target: { value: "lab-a" } });

    expect((selector as HTMLSelectElement).value).toBe("lab-a");
    expect(screen.getAllByText("Ocupado")).toHaveLength(2);
    expect(screen.getAllByText("Bloqueado")).toHaveLength(1);
  });

  it("incluye aulas y laboratorios en el mismo dropdown", () => {
    render(<DisponibilidadAulas espacios={espacios} sesiones={[]} />);

    screen.getByRole("combobox", { name: "Buscar aula o laboratorio" });
    expect(screen.getByRole("option", { name: "Aula 101 · Aula" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Lab-A · Laboratorio" })).toBeTruthy();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
