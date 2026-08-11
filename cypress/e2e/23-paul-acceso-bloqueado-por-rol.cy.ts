describe("Paul - acceso bloqueado por rol", () => {
  it("un docente no puede acceder a la gestion de materias del coordinador", () => {
    cy.login("docente");
    cy.visit("/dashboard/materias", { failOnStatusCode: false });

    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
    cy.contains("Ver mi Horario").should("be.visible");
  });
});
