import { describe, it, expect, vi, beforeEach } from "vitest";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const generateMock = vi.fn();
vi.mock("@/lib/scheduler", () => ({ generate: (...args: unknown[]) => generateMock(...args) }));

import { POST } from "@/app/api/generar-horario/route";
import { GeneracionCanceladaError } from "@/lib/scheduler/types";

function request(body: unknown) {
  return new Request("http://localhost:3000/api/generar-horario", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function leerEventos(res: Response) {
  const texto = await res.text();
  return texto.trim().split("\n").filter(Boolean).map((linea) => JSON.parse(linea));
}

describe("POST /api/generar-horario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("responde 400 si el cuerpo no es JSON válido", async () => {
    const res = await POST(new Request("http://localhost:3000/api/generar-horario", { method: "POST", body: "no-es-json" }));
    expect(res.status).toBe(400);
  });

  it("responde 400 si falta el periodoId", async () => {
    const res = await POST(request({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/período académico/i);
  });

  it("transmite eventos de progreso y el resultado final", async () => {
    generateMock.mockImplementation(async (_periodoId, _reemplazar, _criterio, onProgreso) => {
      onProgreso?.({ paso: "docentes", porcentaje: 50 });
      return { exito: true, asignaciones: [], conflictos: [] };
    });
    const res = await POST(request({ periodoId: "p-1" }));
    const eventos = await leerEventos(res);
    expect(eventos[0]).toMatchObject({ tipo: "progreso", progreso: { paso: "docentes", porcentaje: 50 } });
    expect(eventos[1]).toMatchObject({ tipo: "resultado", resultado: { exito: true } });
  });

  it("transmite un evento de error si generate() lanza una excepción normal", async () => {
    generateMock.mockRejectedValue(new Error("no hay docentes disponibles"));
    const res = await POST(request({ periodoId: "p-1" }));
    const eventos = await leerEventos(res);
    expect(eventos[0]).toMatchObject({ tipo: "error", mensaje: "no hay docentes disponibles" });
  });

  it("transmite un evento de cancelado si la generación se cancela", async () => {
    generateMock.mockRejectedValue(new GeneracionCanceladaError());
    const res = await POST(request({ periodoId: "p-1" }));
    const eventos = await leerEventos(res);
    expect(eventos[0]).toMatchObject({ tipo: "cancelado" });
  });

  it("pasa grupoId y sedeId como criterio cuando vienen en el cuerpo", async () => {
    generateMock.mockResolvedValue({ exito: true, asignaciones: [], conflictos: [] });
    await POST(request({ periodoId: "p-1", grupoId: "g-1", sedeId: "s-1" }));
    expect(generateMock).toHaveBeenCalledWith(
      "p-1",
      null,
      { grupoId: "g-1", sedeId: "s-1" },
      expect.any(Function),
      expect.anything(),
    );
  });
});
