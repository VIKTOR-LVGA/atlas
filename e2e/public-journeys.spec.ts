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
  expect(getSafeAuthRedirect("/intelligence/apply")).toBe("/intelligence/apply");
  expect(getSafeAuthRedirect("/intelligence/apply/status")).toBe(
    "/intelligence/apply/status"
  );
  // Broker portal hibernated: broker/partner next targets are not trusted by default
  expect(getSafeAuthRedirect("/broker/dashboard")).toBe("/dashboard");
  expect(getSafeAuthRedirect("/partner/apply")).toBe("/dashboard");
  expect(
    getSafeAuthRedirect("/broker/dashboard", { brokerPortalEnabled: true })
  ).toBe("/broker/dashboard");
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
  test("homepage is loadable and has no Broker CTAs", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await waitForClientHydration(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Inizia gratis" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Accedi" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Per i broker/i })).toHaveCount(0);
    await expect(page.getByText(/Nessun broker/i)).toHaveCount(0);
    const body = await page.locator("body").innerText();
    expect(body.toLowerCase()).not.toMatch(/broker workspace/);
  });

  test("navbar and footer omit Broker links", async ({ page }) => {
    await page.goto("/");
    await waitForClientHydration(page);
    await expect(page.getByRole("link", { name: "Per i broker" })).toHaveCount(0);
    await expect(page.locator('a[href="/broker"]')).toHaveCount(0);
    await expect(page.locator('a[href="/partner/apply"]')).toHaveCount(0);
  });

  test("registration is consumer-only", async ({ page }) => {
    await page.goto("/register");
    await waitForClientHydration(page);
    await expect(page.getByText("Broker assicurativo", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Privato", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Richiedi accesso ad ATLAS Intelligence" })
    ).toHaveAttribute("href", "/intelligence/apply");
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

  test("hibernated Broker portal routes return 404", async ({ page }) => {
    for (const path of [
      "/broker",
      "/broker/dashboard",
      "/partner",
      "/partner/apply",
      "/partner/status",
      "/partner/dashboard",
    ]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBe(404);
    }
  });

  test("Intelligence routes do not depend on /partner", async ({ page }) => {
    for (const path of ["/intelligence", "/intelligence/apply"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.ok(), path).toBeTruthy();
      await expect(page).not.toHaveURL(/\/partner/);
    }
    await expect(page.locator('a[href^="/partner"]')).toHaveCount(0);
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

    await page.goto("/policies");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/opportunities");
    await expect(page).toHaveURL(/\/login/);
  });

  test("intelligence apply is public and register CTA points to apply", async ({
    page,
  }) => {
    const response = await page.goto("/intelligence/apply");
    expect(response?.ok()).toBeTruthy();
    await waitForClientHydration(page);
    await expect(
      page.getByRole("heading", { name: "Richiedi accesso ad ATLAS Intelligence" })
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/intelligence");
    await waitForClientHydration(page);
    await expect(page.getByRole("link", { name: "Richiedi accesso" }).first()).toHaveAttribute(
      "href",
      "/intelligence/apply"
    );
    await expect(
      page.locator('a[href="/login?intent=intelligence"]')
    ).toHaveCount(1);

    await page.goto("/register");
    await waitForClientHydration(page);
    await expect(
      page.getByRole("link", { name: "Richiedi accesso ad ATLAS Intelligence" })
    ).toHaveAttribute("href", "/intelligence/apply");
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
