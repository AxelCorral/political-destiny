import { expect, test } from "@playwright/test";

// Test-only fixture credential, injected via playwright.config.ts webServer.env —
// matches ANALYTICS_ADMIN_PASSWORD there. Not a real secret.
const TEST_ADMIN_PASSWORD = "e2e-test-password-only";

test.describe("authentification admin /admin/analytics", () => {
  test("redirige vers /admin/login quand non authentifié", async ({ page }) => {
    await page.goto("/admin/analytics/overview");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("refuse un mauvais mot de passe", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/Mot de passe admin/i).fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page.getByText(/Mot de passe incorrect/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("accepte le bon mot de passe puis autorise l'accès au dashboard, et la déconnexion révoque l'accès", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/Mot de passe admin/i).fill(TEST_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page).toHaveURL(/\/admin\/analytics\/overview$/);
    await expect(page.getByRole("heading", { name: /Analytics — Vers l’Élysée/i })).toBeVisible();

    // Every tab is reachable once authenticated.
    await page.getByRole("link", { name: /Équilibrage/i }).click();
    await expect(page).toHaveURL(/\/admin\/analytics\/equilibrage$/);

    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);

    // Session cookie was actually cleared, not just a client-side navigation.
    await page.goto("/admin/analytics/overview");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("/admin/login n'est jamais bloquée par la protection admin", async ({ page }) => {
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBeLessThan(400);
  });
});
