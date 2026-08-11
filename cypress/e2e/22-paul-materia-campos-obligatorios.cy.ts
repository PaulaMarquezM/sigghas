describe("Paul - validacion de campos obligatorios de materia", () => {
  it("no permite guardar una materia cuando faltan campos requeridos", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/materias/nuevo");

    cy.get("#nombre").then(($input) => {
      expect(($input[0] as HTMLInputElement).checkValidity()).to.equal(false);
    });
    cy.contains("button", "Guardar").click();
    cy.location("pathname").should("eq", "/dashboard/materias/nuevo");
  });
});
