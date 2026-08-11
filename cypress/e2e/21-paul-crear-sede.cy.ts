describe("Paul - crear sede", () => {
  const nombre = `E2E-Sede-Paul-${Date.now()}`;

  after(() => cy.task("e2e:borrarSedePorNombre", nombre));

  it("un administrador crea una sede y la ve en el listado", () => {
    cy.login("administrador");
    cy.visit("/dashboard/sedes/nuevo");
    cy.get("#nombre").type(nombre);
    cy.contains("button", "Guardar").click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard/sedes");
    cy.contains(nombre, { timeout: 10000 }).should("be.visible");
  });
});
