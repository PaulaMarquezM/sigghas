import { test, expect } from "@playwright/test";

test.describe("Estudiante Flow E2E", () => {
  test("should allow student to log in, select group and view schedule", async ({ page }) => {
    // 1. Ir a la página de login
    await page.goto("/login");

    // 2. Loguearse como estudiante
    await page.fill('input[type="email"]', "estudiante@puce.edu.ec");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 3. Debería redirigir al dashboard
    await expect(page).toHaveURL("/dashboard");

    // 4. Ir a "Horario del Grupo"
    await page.click('text="Horario del Grupo"');
    await expect(page).toHaveURL("/dashboard/mi-horario");

    // 5. Debería mostrar la grilla de consulta
    await expect(page.locator('text="Selecciona tu Grupo Académico"')).toBeVisible();

    // 6. Seleccionar un grupo en el selector
    await page.selectOption("select", { index: 1 });

    // 7. Verificar que el botón de descarga del PDF se muestre
    const pdfButton = page.locator('text="Descargar PDF del Grupo"');
    await expect(pdfButton).toBeVisible();
  });
});
