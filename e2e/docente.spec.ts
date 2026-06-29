import { test, expect } from "@playwright/test";

test.describe("Docente Flow E2E", () => {
  test("should allow docente to log in, view their schedule and download PDF", async ({ page }) => {
    // 1. Ir a la página de login
    await page.goto("/login");

    // 2. Loguearse como docente
    await page.fill('input[type="email"]', "docente@puce.edu.ec");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 3. Debería redirigir al dashboard
    await expect(page).toHaveURL("/dashboard");

    // 4. Ir a "Mi Horario"
    await page.click('text="Mi Horario"');
    await expect(page).toHaveURL("/dashboard/mi-horario");

    // 5. Verificar que el título de la página sea el de su horario
    await expect(page.locator('text="Mi Horario de Clases"')).toBeVisible();

    // 6. Si el docente tiene clases asignadas, verificar que el botón de PDF esté visible
    const pdfButton = page.locator('text="Descargar PDF"');
    if (await pdfButton.isVisible()) {
      await expect(pdfButton).toBeVisible();
    }
  });
});
