interface FixtureValido {
  periodoId: string;
  periodoNombre: string;
  materiaId: string;
  grupoIds: string[];
  disponibilidadId: string;
}

describe("Generación de horarios — caso válido", () => {
  let fixture: FixtureValido;

  before(() => {
    cy.task<FixtureValido>("e2e:prepararPeriodoValido").then((f) => {
      fixture = f;
    });
  });

  after(() => {
    cy.task("e2e:limpiarValido", fixture);
  });

  it("crea un horario completo sin conflictos", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/generar");
    // Espera a que React hidrate el formulario antes de interactuar; sin esto
    // el clic puede llegar antes que el listener y disparar un submit nativo.
    cy.get("select#periodo").should("be.visible");
    cy.wait(1000);
    cy.get("select#periodo").select(fixture.periodoNombre);
    cy.contains("button", "Generar Horario").click();
    cy.contains("Horario generado exitosamente", { timeout: 20000 }).should("be.visible");
    cy.contains("Editar Horario").should("be.visible");
    cy.screenshot("01-horario-valido-exito", { capture: "viewport" });
  });
});
