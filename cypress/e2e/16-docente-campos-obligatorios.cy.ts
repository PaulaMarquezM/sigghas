describe("Coordinador — validación de nuevo docente", () => {
  it("no permite crear un docente si faltan campos obligatorios", () => {
    // Iniciar sesión como coordinador
    cy.login("coordinador");

    // Abrir formulario de creación de docente
    cy.visit("/dashboard/docentes/nuevo");

    // Confirmar que estamos en el formulario correcto
    cy.contains("Nuevo docente").should("be.visible");

    // Dejamos Nombre y Email vacíos
    cy.get("#nombre").should("have.value", "");
    cy.get("#email").should("have.value", "");

    // Intentar guardar
    cy.contains("button", "Guardar").click();

    // El navegador debe impedir que el formulario se envíe
    cy.url().should("include", "/dashboard/docentes/nuevo");

    // Verificar que los campos obligatorios siguen siendo inválidos
    cy.get("#nombre").should("match", ":invalid");
    cy.get("#email").should("match", ":invalid");

    // Evidencia
    cy.screenshot("16-docente-campos-obligatorios", {
      capture: "viewport",
    });
  });
});