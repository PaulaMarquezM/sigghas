import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConflictPanel } from "@/components/horario/ConflictPanel";
import type { Conflicto } from "@/lib/scheduler/types";

describe("ConflictPanel", () => {
  it("muestra el estado sin conflictos cuando la lista está vacía", () => {
    render(<ConflictPanel conflictos={[]} />);
    expect(screen.getByText("¡Sin Conflictos!")).toBeTruthy();
    expect(screen.getByText("Válido")).toBeTruthy();
  });

  it("agrupa errores críticos y advertencias por separado", () => {
    const conflictos: Conflicto[] = [
      { regla: "PLANIFICADOR", codigo: "DOCENTE_OCUPADO", tipo: "error", mensaje: "El docente ya tiene otra sesión." },
      { regla: "PLANIFICADOR", codigo: "DESCANSO_INSUFICIENTE", tipo: "advertencia", mensaje: "Se recomiendan 2h de descanso." },
    ];
    render(<ConflictPanel conflictos={conflictos} />);
    expect(screen.getByText("Errores Críticos (1)")).toBeTruthy();
    expect(screen.getByText("Advertencias (1)")).toBeTruthy();
    expect(screen.getByText("El docente ya tiene otra sesión.")).toBeTruthy();
    expect(screen.getByText("No Válido")).toBeTruthy();
  });
});
