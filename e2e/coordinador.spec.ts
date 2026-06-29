import { test, expect } from "@playwright/test";

test.describe("Coordinador Flow E2E", () => {
  test("should allow coordinator to log in, view and edit schedules", async ({ page }) => {
    // 1. Ir a la página de login
    await page.goto("/login");

    // 2. Rellenar formulario de login con credenciales de prueba
    await page.fill('input[type="email"]', "coordinador@puce.edu.ec");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 3. Debería redirigir al dashboard
    await expect(page).toHaveURL("/dashboard");

    // 4. Ir a la página de consulta de horarios
    await page.click('text="Consulta de Horarios"');
    await expect(page).toHaveURL("/dashboard/horario");

    // 5. Seleccionar un periodo académico y un grupo
    await page.selectOption("select", { index: 1 }); // Selecciona periodo
    await page.selectOption("select", { index: 2 }); // Selecciona grupo

    // 6. Verificar que se muestre el botón de descargar PDF
    const pdfButton = page.locator('text="Descargar PDF"');
    await expect(pdfButton).toBeVisible();

    // 7. Si hay un horario en borrador, navegar al editor manual
    const editButton = page.locator('text="Editar Horario"');
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page).toHaveURL(/\/dashboard\/editar\/.+/);

      // Verificar que el panel de conflictos y la grilla se carguen
      await expect(page.locator('text="Panel de Validación"')).toBeVisible();
      await expect(page.locator(".sc-grid")).toBeVisible();
    }
  });
});
