interface FixtureAula {
  periodoId: string;
  horarioId: string;
  materiaId: string;
  grupoIds: string[];
  sesionAId: string;
  sesionBId: string;
  espacioAId: string;
  espacioBId: string;
  espacioLibreId: string;
}

describe("Editor manual — asignación de aula ocupada", () => {
  let fixture: FixtureAula;

  before(() => {
    cy.task<FixtureAula>("e2e:prepararHorarioConAulaOcupada").then((f) => {
      fixture = f;
    });
  });

  after(() => {
    cy.task("e2e:limpiarHorario", fixture);
  });

  it("bloquea asignar a una sesión el aula que ya ocupa otra en el mismo horario", () => {
    cy.login("coordinador");
    cy.visit(`/dashboard/editar/${fixture.horarioId}`);
    cy.wait(1000);

    cy.get(`select[data-cy="select-espacio-${fixture.sesionBId}"]`).select(fixture.espacioAId, { force: true });

    // El mensaje ahora incluye el nombre del aula y la franja exacta (ver
    // ESPACIO_OCUPADO en src/lib/scheduler/greedy.ts); se valida la parte
    // estable del texto, no el nombre del aula ni el día que varían por fixture.
    cy.contains("ya está ocupado el", { timeout: 10000 }).should("be.visible");
    cy.screenshot("03-aula-ocupada-bloqueada", { capture: "viewport" });
    cy.get(`select[data-cy="select-espacio-${fixture.sesionBId}"]`).should("have.value", fixture.espacioBId);
  });
});
