import { describe, it, expect } from "vitest";
import {
  groupSesionesBySemestreSede,
  nombreArchivoHorarioPdf,
  slugPeriodoParaArchivo,
} from "@/lib/pdf/groupSesionesBySemestreSede";

describe("groupSesionesBySemestreSede", () => {
  const sesion = (
    id: string,
    semestre: number,
    sede: { id: string; nombre: string; es_central: boolean }
  ) => ({
    id,
    sede_id: sede.id,
    grupos: {
      nombre: `Curso ${semestre}`,
      semestre,
      sede_id: sede.id,
      sedes: { nombre: sede.nombre, es_central: sede.es_central },
    },
  });

  const portoviejo = { id: "sede-pv", nombre: "Portoviejo", es_central: true };
  const manta = { id: "sede-ma", nombre: "Manta", es_central: false };

  it("ordena por semestre y luego sede (central primero)", () => {
    const paginas = groupSesionesBySemestreSede([
      sesion("s5", 2, portoviejo),
      sesion("s2", 1, manta),
      sesion("s1", 1, portoviejo),
      sesion("s3", 1, portoviejo),
      sesion("s4", 5, portoviejo),
    ]);

    expect(paginas.map((p) => p.etiqueta)).toEqual([
      "1.º semestre · Portoviejo",
      "1.º semestre · Manta",
      "2.º semestre · Portoviejo",
      "5.º semestre · Portoviejo",
    ]);
    expect(paginas[0].sesiones.map((s) => s.id)).toEqual(["s1", "s3"]);
  });

  it("omite combinaciones sin semestre o sede válidos", () => {
    const paginas = groupSesionesBySemestreSede([
      { id: "x", grupos: { semestre: 1, sede_id: null, sedes: null } },
      sesion("ok", 1, manta),
    ]);
    expect(paginas).toHaveLength(1);
    expect(paginas[0].etiqueta).toBe("1.º semestre · Manta");
  });
});

describe("nombreArchivoHorarioPdf", () => {
  it("normaliza periodo y estado", () => {
    expect(slugPeriodoParaArchivo("2026-I")).toBe("2026-1");
    expect(slugPeriodoParaArchivo("2026-II")).toBe("2026-2");
    expect(slugPeriodoParaArchivo("2026 - 2")).toBe("2026-2");
    expect(nombreArchivoHorarioPdf("2026-II", "borrador")).toBe("horarios-2026-2-borrador.pdf");
  });
});
