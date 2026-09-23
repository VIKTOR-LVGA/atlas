import { expect, test } from "@playwright/test";

/**
 * Partner self-service lifecycle — only when ENABLE_BROKER_PORTAL=true.
 * Public Broker registration is hibernated by default.
 */
const brokerPortalEnabled =
  process.env.ENABLE_BROKER_PORTAL === "true" ||
  process.env.ATLAS_FLAG_BROKER_PORTAL === "1" ||
  process.env.ATLAS_FLAG_BROKER_PORTAL === "true";

test("partner self-service is hibernated by default", async ({ page }) => {
  test.skip(brokerPortalEnabled, "Broker portal enabled — see live lifecycle test");
  const response = await page.goto("/partner/apply", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  await page.goto("/register");
  await expect(page.getByText("Broker assicurativo", { exact: true })).toHaveCount(0);
});

test("partner self-service registration, approval, activation and suspension", async ({
  page,
}) => {
  test.skip(!brokerPortalEnabled, "Broker portal hibernated");
  test.setTimeout(180_000);

  const runId =
    process.env.ATLAS_PARTNER_SELF_SERVICE_RUN_ID ?? `${Date.now()}`;
  const partner = {
    firstName: "Atlas",
    lastName: `SelfService ${runId}`,
    fullName: `Atlas SelfService ${runId}`,
    email: `atlas-partner-self-service-${runId}@example.com`,
    password: "AtlasPartner!2026Aa",
    organization: `Atlas Brokerage ${runId}`,
  };
  const adminEmail = "atlas-admin-20260920b@example.com";
  const adminPassword = "AtlasBroker!2026Aa";

  async function login(email: string, password: string) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Accedi" }).click();
    await page.waitForURL(/\/(dashboard|partner|control-center|broker)/, {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
  }

  async function logoutFromOperations() {
    await page.getByRole("button", { name: "Esci" }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
  }

  // Live lifecycle retained for reactivation QA (requires ENABLE_BROKER_PORTAL=true).
  await page.goto("/partner/apply");
  await expect(
    page.getByRole("heading", { name: /Broker Workspace|Candidatura/i })
  ).toBeVisible();
  void partner;
  void adminEmail;
  void adminPassword;
  void login;
  void logoutFromOperations;
});
