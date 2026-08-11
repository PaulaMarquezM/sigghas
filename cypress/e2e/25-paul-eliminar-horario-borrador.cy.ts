interface FixtureBorrador {
  periodoId: string;
  horarioId: string;
  materiaId: string;
  grupoIds: string[];
}

describe("Paul - eliminar horario borrador", () => {
  let fixture: FixtureBorrador;

  before(() => {
    cy.task<FixtureBorrador>("e2e:prepararHorarioConAulaOcupada").then((value) => {
      fixture = value;
    });
  });

  after(() => cy.task("e2e:limpiarHorario", fixture));

  it("elimina un horario en borrador y lo quita del listado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/editar");
    cy.on("window:confirm", () => true);
    cy.contains(fixture.horarioId)
      .parentsUntil("body")
      .filter("div")
      .filter((_, card) => Cypress.$(card).find('[aria-label="Eliminar horario"]').length > 0)
      .first()
      .find('[aria-label="Eliminar horario"]')
      .click();

    cy.task<boolean>("e2e:horarioExiste", fixture.horarioId).should("equal", false);
  });
});
