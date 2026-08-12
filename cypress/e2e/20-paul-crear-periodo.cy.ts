describe("Paul - crear periodo academico", () => {
  const nombre = `E2E-Periodo-Paul-${Date.now()}`;

  before(() => cy.task("e2e:limpiarPeriodosPaul"));
  after(() => cy.task("e2e:borrarPeriodoPorNombre", nombre));

  it("un coordinador crea un periodo y lo ve en el listado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/periodos/nuevo");
    cy.get("#nombre").type(nombre);
    cy.get("#fecha_inicio").type("2099-01-01");
    cy.get("#fecha_fin").type("2099-06-30");
    cy.contains("button", "Guardar").click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard/periodos");
    cy.contains(nombre.toUpperCase(), { timeout: 10000 }).should("be.visible");
  });
});
