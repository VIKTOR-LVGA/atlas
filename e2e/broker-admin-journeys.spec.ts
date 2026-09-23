import { expect, test, type Page } from "@playwright/test";

/**
 * Broker / Partner portal E2E — only when ENABLE_BROKER_PORTAL=true.
 * Default product positioning hibernates the Broker portal.
 */
const brokerPortalEnabled =
  process.env.ENABLE_BROKER_PORTAL === "true" ||
  process.env.ATLAS_FLAG_BROKER_PORTAL === "1" ||
  process.env.ATLAS_FLAG_BROKER_PORTAL === "true";

test.describe("operations access boundaries", () => {
  test("anonymous control center redirects to login", async ({ page }) => {
    await page.goto("/control-center");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("hibernated broker routes return 404 for anonymous", async ({ page }) => {
    test.skip(brokerPortalEnabled, "Broker portal enabled in this env");
    const response = await page.goto("/broker", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);
    const partner = await page.goto("/partner/dashboard", {
      waitUntil: "domcontentloaded",
    });
    expect(partner?.status()).toBe(404);
  });

  test("legacy admin route redirects anonymous to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});

test.describe("broker portal live journeys", () => {
  test.skip(!brokerPortalEnabled, "Broker portal hibernated (ENABLE_BROKER_PORTAL≠true)");

  const runId = process.env.ATLAS_BROKER_E2E_RUN_ID ?? "20260920b";
  const password = "AtlasBroker!2026Aa";
  const email = (role: "consumer" | "broker-a" | "broker-b" | "admin") =>
    `atlas-${role}-${runId}@example.com`;

  async function login(
    page: Page,
    role: "consumer" | "broker-a" | "broker-b" | "admin"
  ) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByLabel("Email").fill(email(role));
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Accedi" }).click();
    await page.waitForURL(/\/(dashboard|partner|control-center|broker|admin)/, {
      timeout: 20_000,
      waitUntil: "domcontentloaded",
    });
  }

  test("broker login lands in workspace", async ({ page }) => {
    await login(page, "broker-a");
    await page.goto("/broker/dashboard");
    await expect(page.getByRole("heading", { name: /Buongiorno/ })).toBeVisible();
  });

  test("consumer cannot open control center", async ({ page }) => {
    await login(page, "consumer");
    await page.goto("/control-center");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
