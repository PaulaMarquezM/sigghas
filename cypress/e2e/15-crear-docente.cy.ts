describe("Coordinador — crear docente", () => {
  const marca = Date.now();
  const nombre = `Docente E2E ${marca}`;
  const email = `docente.e2e.${marca}@sigghas.test`;

  it("crea un docente nuevo correctamente", () => {
    // Iniciar sesión como coordinador
    cy.login("coordinador");

    // Abrir el formulario de nuevo docente
    cy.visit("/dashboard/docentes/nuevo");

    // Completar los datos principales
    cy.get("#nombre").type(nombre);
    cy.get("#email").type(email);

    // Seleccionar tipo de contrato
    cy.get("#tipo_contrato").select("por_horas");

    // Indicar las horas máximas semanales
    cy.get("#max_horas_semana").clear().type("20");

    // Seleccionar la primera sede disponible
    cy.get('input[name="sedes_ids"]').first().check();

    // Seleccionar la primera sede marcada como sede principal
    cy.get("#sede_principal_id")
      .should("not.be.disabled")
      .then(($select) => {
        const primeraOpcion = $select
          .find('option:not([value=""])')
          .first()
          .attr("value");

        if (!primeraOpcion) {
          throw new Error("No se encontró una sede disponible");
        }

        cy.wrap($select).select(primeraOpcion);
      });

    // Guardar el docente
    cy.contains("button", "Guardar").click();

    // Verificar que realmente se creó
    cy.contains("Docente creado", { timeout: 15000 }).should("be.visible");
    cy.contains(email).should("be.visible");

    // Evidencia
    cy.screenshot("15-docente-creado", {
      capture: "viewport",
    });
  });
});