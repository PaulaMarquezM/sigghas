import { describe, expect, it } from "vitest";
import { consolidarBloquesDisponibilidad, expandirBloquesDisponibilidad } from "@/lib/disponibilidad";

describe("consolidarBloquesDisponibilidad", () => {
  it("une las celdas contiguas de la misma jornada", () => {
    expect(consolidarBloquesDisponibilidad(["1-08:00", "1-08:30", "1-09:00"])).toEqual([
      { dia_semana: 1, hora_inicio: "08:00", hora_fin: "09:30" },
    ]);
  });

  it("mantiene separadas las franjas con un intervalo", () => {
    expect(consolidarBloquesDisponibilidad(["1-08:00", "1-08:30", "1-10:00", "2-08:00"])).toEqual([
      { dia_semana: 1, hora_inicio: "08:00", hora_fin: "09:00" },
      { dia_semana: 1, hora_inicio: "10:00", hora_fin: "10:30" },
      { dia_semana: 2, hora_inicio: "08:00", hora_fin: "08:30" },
    ]);
  });

  it("marca todas las celdas incluidas en una franja guardada", () => {
    expect([...expandirBloquesDisponibilidad([
      { dia_semana: 1, hora_inicio: "08:00", hora_fin: "09:30" },
    ])]).toEqual(["1-08:00", "1-08:30", "1-09:00"]);
  });
});
