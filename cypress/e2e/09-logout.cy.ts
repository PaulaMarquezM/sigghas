describe("Cerrar sesión", () => {
  it("termina la sesión y vuelve al login", () => {
    cy.login("coordinador");
    cy.contains("Cerrar sesión").click();
    cy.url({ timeout: 10000 }).should("include", "/login");
    // Sin sesión, cualquier ruta protegida debe regresar al login.
    cy.visit("/dashboard");
    cy.url({ timeout: 10000 }).should("include", "/login");
  });
});
