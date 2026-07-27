describe("Login — credenciales inválidas", () => {
  it("no deja entrar con la contraseña equivocada y muestra el error", () => {
    cy.visit("/login");
    cy.contains("button", "Coordinador").click();
    cy.get("input#email").type("coordinador@sigghas.test");
    cy.get("input#password").type("password-incorrecta");
    cy.contains("button", "Iniciar sesión").click();
    cy.url({ timeout: 10000 }).should("include", "/login");
    cy.contains(/correo o contraseña incorrectos/i).should("be.visible");
    cy.screenshot("08-login-invalido", { capture: "viewport" });
  });
});
