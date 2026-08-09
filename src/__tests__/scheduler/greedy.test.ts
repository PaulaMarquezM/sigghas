import { describe, expect, it } from "vitest";
import { resolverConBacktrack } from "@/lib/scheduler/backtrack";
import { CONFIG_DEFAULT, type ContextoProgramacion } from "@/lib/scheduler/types";

const contexto: ContextoProgramacion = {
  periodo: { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-03-01", fecha_fin: "2026-07-31", activo: true, creado_en: "" },
  materias: [{ id: "m-1", codigo: "SW-01", nombre: "Materia de 4,5 h", semestre: 5, horas_semana: 4.5, horas_teoria: 2.5, horas_practica: 2, requiere_laboratorio: false, modalidad: "presencial", activo: true, nivel: 5, creado_en: "" }],
  grupos: [{ id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" }],
  docentes: [{ id: "d-1", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad: [1, 2, 3, 4, 5].map((dia_semana) => ({ dia_semana: dia_semana as 1 | 2 | 3 | 4 | 5, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false })) }],
  espacios: [{ id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" }],
  asignaciones_docente: [{ periodo_id: "p-1", materia_id: "m-1", grupo_id: "g-1", docente_id: "d-1" }],
  horario_id: "h-1",
  config: CONFIG_DEFAULT,
};

describe("planificador determinista", () => {
  it("divide 4,5 horas en 2,5 + 2 y no concentra las sesiones en un día", async () => {
    const resultado = await resolverConBacktrack(contexto, [], 10_000);
    expect(resultado.exito).toBe(true);
    expect(resultado.asignaciones).toHaveLength(2);
    const duraciones = resultado.asignaciones.map((sesion) => {
      const [inicioHora, inicioMinuto] = sesion.hora_inicio.split(":").map(Number);
      const [finHora, finMinuto] = sesion.hora_fin.split(":").map(Number);
      return (finHora * 60 + finMinuto - inicioHora * 60 - inicioMinuto) / 60;
    }).sort();
    expect(duraciones).toEqual([2, 2.5]);
    expect(new Set(resultado.asignaciones.map((sesion) => sesion.dia_semana)).size).toBe(2);
  });

  it("reporta la ausencia de docente por combinación materia–grupo", async () => {
    const sinDocente = { ...contexto, asignaciones_docente: [] };
    const resultado = await resolverConBacktrack(sinDocente, [], 10_000);
    expect(resultado.exito).toBe(false);
    expect(resultado.conflictos[0]?.codigo).toBe("DOCENTE_SIN_ASIGNAR");
  });
});
