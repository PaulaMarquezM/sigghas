interface FixtureBorrador {
  periodoId: string;
  horarioId: string;
  materiaId: string;
  grupoIds: string[];
}

describe("Paul - visualizar horario borrador", () => {
  let fixture: FixtureBorrador;

  before(() => {
    cy.task<FixtureBorrador>("e2e:prepararHorarioConAulaOcupada").then((value) => {
      fixture = value;
    });
  });

  after(() => cy.task("e2e:limpiarHorario", fixture));

  it("el coordinador visualiza un horario borrador en el listado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/editar");

    cy.contains(`ID: ${fixture.horarioId}`, { timeout: 10000 }).should("be.visible");

    cy.get(`a[href="/api/pdf/horario/${fixture.horarioId}"]`)
      .should("exist");
  });
});