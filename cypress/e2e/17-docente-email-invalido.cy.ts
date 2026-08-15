describe("Coordinador — validación de correo de docente", () => {
  it("no permite crear un docente con un correo inválido", () => {
    // Iniciar sesión como coordinador
    cy.login("coordinador");

    // Abrir formulario de nuevo docente
    cy.visit("/dashboard/docentes/nuevo");

    // Confirmar que estamos en la pantalla correcta
    cy.contains("Nuevo docente").should("be.visible");

    // Escribir un nombre válido
    cy.get("#nombre").type("Docente Prueba Cypress");

    // Escribir un correo con formato incorrecto
    cy.get("#email").type("correo-invalido");

    // Verificar que el navegador detecta el correo como inválido
    cy.get("#email").should("match", ":invalid");

    // Intentar guardar
    cy.contains("button", "Guardar").click();

    // Debe permanecer en el formulario
    cy.url().should("include", "/dashboard/docentes/nuevo");

    // El correo debe seguir marcado como inválido
    cy.get("#email").should("match", ":invalid");

    // Guardar evidencia
    cy.screenshot("17-docente-email-invalido", {
      capture: "viewport",
    });
  });
});