describe("Coordinador — validación de sede del docente", () => {
  it("no permite crear un docente sin seleccionar una sede", () => {
    // Iniciar sesión como coordinador
    cy.login("coordinador");

    // Abrir formulario de nuevo docente
    cy.visit("/dashboard/docentes/nuevo");

    // Confirmar que estamos en la pantalla correcta
    cy.contains("Nuevo docente").should("be.visible");

    // Completar datos válidos
    cy.get("#nombre").type("Docente Sin Sede Cypress");
    cy.get("#email").type("docente.sin.sede.cypress@sigghas.test");

    // Seleccionar contrato
    cy.get("#tipo_contrato").select("por_horas");

    // Colocar horas válidas
    cy.get("#max_horas_semana").clear().type("20");

    // No seleccionamos ninguna sede
    cy.get('input[name="sedes_ids"]').should("not.be.checked");

    // La sede principal debe seguir deshabilitada
    cy.get("#sede_principal_id").should("be.disabled");

    // Intentar guardar
    cy.contains("button", "Guardar").click();

    // Debe permanecer en el formulario
    cy.url().should("include", "/dashboard/docentes/nuevo");

    // Confirmar que sigue sin haber sede seleccionada
    cy.get('input[name="sedes_ids"]').should("not.be.checked");
    cy.get("#sede_principal_id").should("be.disabled");

    // Evidencia
    cy.screenshot("19-docente-sede-obligatoria", {
      capture: "viewport",
    });
  });
});