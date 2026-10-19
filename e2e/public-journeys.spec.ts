import { expect, test, type Page } from "@playwright/test";
import { mapSupabaseAuthError } from "../lib/auth-errors";
import { getSafeAuthRedirect } from "../lib/auth-redirect";

async function waitForClientHydration(page: Page) {
  await expect(page.getByRole("button", { name: "Tema visivo" })).toHaveCount(0);
}

test("login next param rejects open redirects", () => {
  expect(getSafeAuthRedirect("/policies")).toBe("/policies");
  expect(getSafeAuthRedirect("/opportunities")).toBe("/opportunities");
  expect(getSafeAuthRedirect("/activity?filter=recent")).toBe(
    "/activity?filter=recent"
  );
  expect(getSafeAuthRedirect("/atlas/ask?q=franchise")).toBe(
    "/atlas/ask?q=franchise"
  );
  expect(getSafeAuthRedirect("/claims/new?policy=abc")).toBe(
    "/claims/new?policy=abc"
  );
  expect(getSafeAuthRedirect("/search?q=malattia")).toBe(
    "/search?q=malattia"
  );
  expect(getSafeAuthRedirect("/documents/abc?tab=file")).toBe("/documents/abc?tab=file");
  expect(getSafeAuthRedirect("https://evil.example")).toBe("/dashboard");
  expect(getSafeAuthRedirect("//evil.example")).toBe("/dashboard");
  expect(getSafeAuthRedirect("/\\evil.example")).toBe("/dashboard");
  expect(getSafeAuthRedirect("javascript:alert(1)")).toBe("/dashboard");
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

  test("hibernated Broker and Partner routes show an explicit unavailable state", async ({
    page,
  }) => {
    for (const path of [
      "/broker",
      "/broker/dashboard",
      "/partner",
      "/partner/apply",
      "/partner/status",
      "/partner/dashboard",
    ]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.ok(), path).toBeTruthy();
      await expect(page).toHaveURL(/\/broker-unavailable$/);
      await expect(
        page.getByRole("heading", { name: "Area operativa non disponibile" })
      ).toBeVisible();
      await expect(page.getByText(/dashboard alternativo/i)).toBeVisible();
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

  test("Intelligence navigation anchors return to landing sections", async ({ page }) => {
    await page.goto("/intelligence");
    await expect(page.getByRole("link", { name: "Come funziona" }).first()).toHaveAttribute(
      "href",
      "/#how-it-works"
    );
    await expect(page.getByRole("link", { name: "Sicurezza" }).first()).toHaveAttribute(
      "href",
      "/#security"
    );
    await expect(page.getByRole("link", { name: "FAQ" }).first()).toHaveAttribute(
      "href",
      "/#faq"
    );
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

    for (const path of [
      "/activity?filter=recent",
      "/atlas/ask?q=franchise",
      "/claims/new?policy=abc",
      "/search?q=malattia",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?next=/);
      expect(new URL(page.url()).searchParams.get("next"), path).toBe(path);
    }
  });

  test("expired session is cleared and preserves the requested destination", async ({
    context,
    page,
  }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    test.skip(!supabaseUrl, "Richiede la configurazione pubblica Supabase del test runner.");
    const projectRef = new URL(supabaseUrl!).hostname.split(".")[0];
    await context.addCookies([
      {
        name: `sb-${projectRef}-auth-token`,
        value: JSON.stringify({ access_token: "expired", refresh_token: "expired" }),
        url: test.info().project.use.baseURL as string,
      },
    ]);

    await page.goto("/activity?filter=recent");
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(new URL(page.url()).searchParams.get("next")).toBe(
      "/activity?filter=recent"
    );
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

  test("intelligence apply reports all invalid fields together without submitting", async ({
    page,
  }) => {
    await page.goto("/intelligence/apply");
    for (const name of [
      "Panoramica mercato osservato",
      "Switching tra compagnie",
      "Benchmark premi",
    ]) {
      await page.getByLabel(name).uncheck();
    }

    await page.getByRole("button", { name: "Invia candidatura" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Controlla i campi evidenziati." })
    ).toBeFocused();
    for (const id of [
      "first-name-error",
      "last-name-error",
      "email-error",
      "company-name-error",
      "modules-error",
      "reason-error",
      "password-error",
      "confirm-password-error",
      "consent-error",
    ]) {
      await expect(page.locator(`#${id}`), id).toBeVisible();
    }
    await expect(page).toHaveURL(/\/intelligence\/apply$/);
  });

  test("pilot metadata endpoints resolve without exposing private routes", async ({
    request,
  }) => {
    const home = await request.get("/");
    expect(home.ok()).toBeTruthy();
    expect(await home.text()).toMatch(/<meta name="robots" content="noindex, nofollow"/);

    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Disallow: /");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("/intelligence");
    expect(sitemapBody).not.toMatch(/dashboard|policies|documents|settings/);

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).short_name).toBe("ATLAS");
  });

  test("security headers are emitted on public responses", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy-report-only"]).toContain(
      "frame-ancestors 'none'"
    );
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-frame-options"]).toBe("DENY");
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
