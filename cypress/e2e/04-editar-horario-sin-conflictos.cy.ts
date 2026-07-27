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

describe("Editor manual — edición de horario sin conflictos", () => {
  let fixture: FixtureAula;

  before(() => {
    cy.task<FixtureAula>("e2e:prepararHorarioConAulaOcupada").then((f) => {
      fixture = f;
    });
  });

  after(() => {
    cy.task("e2e:limpiarHorario", fixture);
  });

  it("permite reasignar el aula de una sesión a un espacio libre", () => {
    cy.login("coordinador");
    cy.visit(`/dashboard/editar/${fixture.horarioId}`);
    cy.wait(1000);

    cy.get(`select[data-cy="select-espacio-${fixture.sesionBId}"]`).select(fixture.espacioLibreId, { force: true });

    cy.contains("Aula asignada correctamente.", { timeout: 10000 }).should("be.visible");
    cy.screenshot("04-edicion-sin-conflictos", { capture: "viewport" });
    cy.reload();
    cy.get(`select[data-cy="select-espacio-${fixture.sesionBId}"]`).should("have.value", fixture.espacioLibreId);
  });
});
