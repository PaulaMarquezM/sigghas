interface FixtureConflicto {
  periodoId: string;
  periodoNombre: string;
  materiaId: string;
  grupoIds: string[];
  disponibilidadId: string;
}

describe("Generación de horarios — caso con conflicto", () => {
  let fixture: FixtureConflicto;

  before(() => {
    cy.task<FixtureConflicto>("e2e:prepararPeriodoConConflicto").then((f) => {
      fixture = f;
    });
  });

  after(() => {
    cy.task("e2e:limpiarConflicto", fixture);
  });

  it("muestra los conflictos y no guarda ningún horario", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/generar");
    cy.get("select#periodo").should("be.visible");
    cy.wait(1000);
    cy.get("select#periodo").select(fixture.periodoNombre);
    cy.contains("button", "Generar automáticamente").click();
    cy.contains("Horario generado con conflictos", { timeout: 20000 }).should("be.visible");
    cy.contains("Corrige estos datos antes de volver a intentar:").should("be.visible");
    cy.screenshot("02-horario-conflicto", { capture: "viewport" });

    cy.task("e2e:contarHorarios", fixture.periodoId).then((cantidad) => {
      expect(cantidad, "no debe haberse guardado ningún horario para este período").to.eq(0);
    });
  });
});
