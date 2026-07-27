describe("Coordinador — crear materia", () => {
  const codigo = `E2E-MAT-${Date.now()}`;

  after(() => {
    cy.task("e2e:borrarMateriaPorCodigo", codigo);
  });

  it("crea una materia nueva y aparece en el listado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/materias/nuevo");
    cy.get("#codigo").type(codigo);
    cy.get("#nombre").type("Materia de prueba E2E");
    cy.get("#nivel").clear().type("3");
    cy.get("#horas_teoria").clear().type("2");
    cy.get("#horas_practica").clear().type("0");
    cy.contains("button", "Guardar").click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard/materias");
    cy.contains(codigo, { timeout: 10000 }).should("be.visible");
    cy.screenshot("10-materia-creada", { capture: "viewport" });
  });
});
