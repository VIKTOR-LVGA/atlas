import { expect, test, type Page } from "@playwright/test";
import { mapSupabaseAuthError } from "../lib/auth-errors";
import { getSafeAuthRedirect } from "../lib/auth-redirect";

async function waitForClientHydration(page: Page) {
  await expect(page.getByRole("button", { name: "Tema visivo" })).toHaveCount(0);
}

test("login next param rejects open redirects", () => {
  expect(getSafeAuthRedirect("/policies")).toBe("/policies");
  expect(getSafeAuthRedirect("/opportunities")).toBe("/opportunities");
  expect(getSafeAuthRedirect("/documents/abc?tab=file")).toBe("/documents/abc?tab=file");
  expect(getSafeAuthRedirect("https://evil.example")).toBe("/dashboard");
  expect(getSafeAuthRedirect("//evil.example")).toBe("/dashboard");
  expect(getSafeAuthRedirect("/login")).toBe("/dashboard");
  expect(getSafeAuthRedirect("/register")).toBe("/dashboard");
});

test("recovery errors prefer actionable backend states", () => {
  expect(mapSupabaseAuthError("email rate limit exceeded", "recovery")).toBe(
    "Troppi tentativi. Riprova tra qualche minuto."
  );
  expect(mapSupabaseAuthError("Email address not authorized", "recovery")).toBe(
    "Il servizio email di recupero non è configurato per questo indirizzo."
  );
});

test.describe("Atlas public journeys", () => {
  test("homepage is loadable", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await waitForClientHydration(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Inizia gratis" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Accedi" }).first()).toBeVisible();
  });

  test("registration validates empty and mismatched passwords", async ({ page }) => {
    await page.goto("/register");
    await waitForClientHydration(page);
    await expect(page.getByText("Privato", { exact: true })).toBeVisible();
    await expect(page.getByText("Broker assicurativo", { exact: true })).toBeVisible();
    await page.getByText("Broker assicurativo", { exact: true }).click();
    await expect(page.getByText(/Broker Workspace sarà disponibile/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Richiedi accesso ad ATLAS Intelligence" })
    ).toBeVisible();
    await page.getByText("Privato", { exact: true }).click();
    await page.getByRole("button", { name: "Crea account" }).click();
    await expect(page.getByText("Inserisci il tuo nome completo.")).toBeVisible();
    await expect(page.getByText("Inserisci la tua email.")).toBeVisible();

    await page.getByLabel("Nome completo").fill("Audit Tester");
    await page.getByLabel("Email").fill("atlas.audit@example.com");
    await page.getByLabel("Password", { exact: true }).fill("AuditTest9");
    await page.getByLabel("Conferma password").fill("AuditTest8");
    await page.getByRole("button", { name: "Crea account" }).click();
    await expect(page.getByText("Le password non coincidono.")).toBeVisible();
  });

  test("login validates empty fields", async ({ page }) => {
    await page.goto("/login");
    await waitForClientHydration(page);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page.getByText("Inserisci la tua email.")).toBeVisible();
    await expect(page.getByText("Inserisci la password.")).toBeVisible();
  });

  test("login with credentials shows an authentication error", async ({ page }) => {
    await page.goto("/login");
    await waitForClientHydration(page);
    await page.getByLabel("Email").fill("nobody-audit@example.com");
    await page.getByLabel("Password").fill("WrongPass123");
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated product routes redirect to login with next", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(new URL(page.url()).searchParams.get("next")).toBe("/dashboard");

    await page.goto("/documents/abc");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/documents/abc");
  });

  test("logout is not required to keep private routes blocked", async ({ page }) => {
    await page.goto("/policies");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/opportunities");
    await expect(page).toHaveURL(/\/login/);
  });

  test("reset password without a recovery token is rejected", async ({ page }) => {
    await page.goto("/reset-password");
    await waitForClientHydration(page);
    await expect(page.getByRole("heading", { name: "Link non valido" }).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("link", { name: "Richiedi nuovo link" })).toBeVisible();
  });
});
