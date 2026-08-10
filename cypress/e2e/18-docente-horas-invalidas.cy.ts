describe("Coordinador — validación de horas del docente", () => {
  it("no permite registrar más de 60 horas semanales", () => {
    // Iniciar sesión como coordinador
    cy.login("coordinador");

    // Abrir formulario de nuevo docente
    cy.visit("/dashboard/docentes/nuevo");

    // Confirmar que estamos en la pantalla correcta
    cy.contains("Nuevo docente").should("be.visible");

    // Completar nombre y correo válidos
    cy.get("#nombre").type("Docente Horas Cypress");
    cy.get("#email").type("docente.horas.cypress@sigghas.test");

    // Seleccionar contrato por horas
    cy.get("#tipo_contrato").select("por_horas");

    // Colocar una cantidad mayor al máximo permitido
    cy.get("#max_horas_semana").clear().type("61");

    // El campo debe ser inválido
    cy.get("#max_horas_semana").should("match", ":invalid");

    // Intentar guardar
    cy.contains("button", "Guardar").click();

    // Debe permanecer en el formulario
    cy.url().should("include", "/dashboard/docentes/nuevo");

    // Confirmar que el dato sigue siendo inválido
    cy.get("#max_horas_semana").should("match", ":invalid");

    // Evidencia
    cy.screenshot("18-docente-horas-invalidas", {
      capture: "viewport",
    });
  });
});