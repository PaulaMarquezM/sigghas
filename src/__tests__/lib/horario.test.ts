import { describe, it, expect } from "vitest";
import {
  generarSlots30,
  slotsDe30Min,
  offsetPxDesdeInicio,
  alturaBloquePx,
  indiceColorEstable,
} from "@/lib/horario";

describe("generarSlots30", () => {
  it("usa el rango base 07:00–18:00 cuando no hay sesiones", () => {
    const slots = generarSlots30([]);
    expect(slots[0]).toBe("07:00");
    expect(slots[slots.length - 1]).toBe("18:00");
  });

  it("extiende el rango si una sesión empieza antes o termina después de la base", () => {
    const slots = generarSlots30([{ hora_inicio: "06:15", hora_fin: "19:40" }]);
    expect(slots[0]).toBe("06:00");
    expect(slots[slots.length - 1]).toBe("20:00");
  });

  it("ignora sesiones sin hora_inicio u hora_fin", () => {
    const slots = generarSlots30([{ hora_inicio: null, hora_fin: undefined }]);
    expect(slots[0]).toBe("07:00");
    expect(slots[slots.length - 1]).toBe("18:00");
  });
});

describe("slotsDe30Min", () => {
  it("calcula la cantidad exacta de franjas de 30 minutos", () => {
    expect(slotsDe30Min("08:00", "09:00")).toBe(2);
    expect(slotsDe30Min("08:00", "08:30")).toBe(1);
  });

  it("redondea hacia arriba si la duración no es múltiplo exacto de 30", () => {
    expect(slotsDe30Min("08:00", "09:15")).toBe(3);
  });

  it("devuelve al menos 1 franja aunque fin no sea posterior a inicio", () => {
    expect(slotsDe30Min("09:00", "09:00")).toBe(1);
    expect(slotsDe30Min("09:00", "08:00")).toBe(1);
  });
});

describe("offsetPxDesdeInicio", () => {
  it("calcula el offset proporcional a la altura de una franja de 30 min", () => {
    expect(offsetPxDesdeInicio("08:00", 7 * 60, 40)).toBe(80);
    expect(offsetPxDesdeInicio("07:00", 7 * 60, 40)).toBe(0);
  });
});

describe("alturaBloquePx", () => {
  it("calcula la altura según la cantidad de franjas menos el gap", () => {
    expect(alturaBloquePx("08:00", "09:00", 40)).toBe(78);
    expect(alturaBloquePx("08:00", "09:00", 40, 0)).toBe(80);
  });
});

describe("indiceColorEstable", () => {
  it("siempre devuelve el mismo índice para el mismo valor", () => {
    const a = indiceColorEstable("docente-123", 8);
    const b = indiceColorEstable("docente-123", 8);
    expect(a).toBe(b);
  });

  it("devuelve un índice dentro del rango [0, cantidad)", () => {
    const indice = indiceColorEstable("cualquier-cosa", 5);
    expect(indice).toBeGreaterThanOrEqual(0);
    expect(indice).toBeLessThan(5);
  });

  it("usa un valor por defecto estable cuando no hay docente", () => {
    expect(indiceColorEstable(null, 6)).toBe(indiceColorEstable(undefined, 6));
  });
});
