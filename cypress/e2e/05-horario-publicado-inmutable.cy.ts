interface FixturePublicado {
  periodoId: string;
  horarioId: string;
  materiaId: string;
  grupoIds: string[];
  sesionId: string;
  espacioId: string;
  espacioLibreId: string;
}

describe("Regla de negocio — un horario publicado es inmutable (regresión bug 8)", () => {
  let fixture: FixturePublicado;

  before(() => {
    cy.task<FixturePublicado>("e2e:prepararHorarioPublicado").then((f) => {
      fixture = f;
    });
  });

  after(() => {
    cy.task("e2e:limpiarHorario", fixture);
  });

  it("el editor no ofrece controles de edición para un horario ya publicado", () => {
    cy.login("coordinador");
    cy.visit(`/dashboard/editar/${fixture.horarioId}`);
    // El badge de estado se ve en mayúsculas por CSS (text-transform), pero
    // el texto real en el DOM es el valor crudo del enum: "publicado".
    cy.contains("publicado", { timeout: 15000 }).should("be.visible");
    // Al estar publicado, HorarioGrid se renderiza con editable=false: no
    // debe existir ningún <select> para reasignar aula, ni el botón de
    // "Publicar Horario" (ya se publicó).
    cy.get(`select[data-cy="select-espacio-${fixture.sesionId}"]`).should("not.exist");
    cy.contains("button", "Publicar Horario").should("not.exist");
    cy.contains("Descargar PDF").should("be.visible");
    cy.screenshot("05-horario-publicado-solo-lectura", { capture: "viewport" });
  });
});
