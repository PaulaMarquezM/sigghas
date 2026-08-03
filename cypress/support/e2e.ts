import "./commands";

// Next.js en modo dev a veces lanza un error de su instrumentación interna
// (Performance.measure con timestamp negativo) durante navegaciones rápidas
// entre layouts — no es un error de la aplicación ni afecta al usuario real.
// Sin este filtro, Cypress marca el test como fallido por una excepción no
// capturada que no tiene nada que ver con lo que se está probando.
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("cannot have a negative time stamp")) {
    return false;
  }
});
