import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const getSessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: () => getSessionMock() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import { getSesionesByPeriodoyGrupoAction, getSesionesByPeriodoyDocenteAction } from "@/app/dashboard/horario/actions";

describe("horario actions (consulta de horarios)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "u-1" }, perfil: { id: "u-1", rol: "coordinador" } });
  });

  it("getSesionesByPeriodoyGrupoAction: sin horario publicado devuelve listas vacías", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok([])));
    const resultado = await getSesionesByPeriodoyGrupoAction("p-1", "g-1");
    expect(resultado).toEqual({ sesiones: [], horario: null });
  });

  it("getSesionesByPeriodoyGrupoAction: combina sesiones directas y compartidas del grupo", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "horarios") return createChainableQuery(ok([{ id: "h-1", estado: "publicado" }]));
      if (table === "sesiones") return createChainableQuery(ok([{ id: "s-1" }]));
      if (table === "sesiones_grupos_compartidos") return createChainableQuery(ok([{ sesiones: { id: "s-2" } }]));
      return createChainableQuery(ok([]));
    });
    const resultado = await getSesionesByPeriodoyGrupoAction("p-1", "g-1");
    expect(resultado.horario).toEqual({ id: "h-1", estado: "publicado" });
    expect(resultado.sesiones).toHaveLength(2);
    expect(resultado.sesiones[1]).toMatchObject({ id: "s-2", grupo_id: "g-1", grupos: { nombre: "Grupo compartido" } });
  });

  it("getSesionesByPeriodoyDocenteAction: un docente no puede consultar el horario de otro docente", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "u-1" }, perfil: { id: "u-1", rol: "docente" } });
    await expect(getSesionesByPeriodoyDocenteAction("p-1", "otro-docente")).rejects.toThrow(
      "No autorizado para consultar el horario de otro docente."
    );
  });

  it("getSesionesByPeriodoyDocenteAction: un docente sí puede consultar su propio horario", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "d-1" }, perfil: { id: "d-1", rol: "docente" } });
    fromMock.mockImplementation((table: string) =>
      table === "horarios" ? createChainableQuery(ok([{ id: "h-1", estado: "publicado" }])) : createChainableQuery(ok([{ id: "s-1" }]))
    );
    const resultado = await getSesionesByPeriodoyDocenteAction("p-1", "d-1");
    expect(resultado.sesiones).toEqual([{ id: "s-1" }]);
  });

  it("getSesionesByPeriodoyDocenteAction: un rol sin permiso (apoyo) es rechazado", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "u-1" }, perfil: { id: "u-1", rol: "apoyo" } });
    await expect(getSesionesByPeriodoyDocenteAction("p-1", "d-1")).rejects.toThrow(
      "No autorizado para consultar horarios docentes."
    );
  });
});
