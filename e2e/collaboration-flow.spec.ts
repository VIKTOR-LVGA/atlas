import { expect, test, type Page } from "@playwright/test";

/**
 * Collaboration happy-path + security boundaries.
 * Requires seeded E2E users (ATLAS_BROKER_E2E_RUN_ID) when running against live.
 * Anonymous / route-level checks always run.
 */

const runId = process.env.ATLAS_BROKER_E2E_RUN_ID ?? "20260920b";
const password = process.env.ATLAS_BROKER_E2E_PASSWORD ?? "AtlasBroker!2026Aa";
const email = (role: "consumer" | "broker-a" | "broker-b" | "admin") =>
  `atlas-${role}-${runId}@example.com`;

async function login(page: Page, role: "consumer" | "broker-a" | "broker-b" | "admin") {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.getByLabel("Email").fill(email(role));
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/(dashboard|partner|control-center|broker|admin)/, {
    timeout: 25_000,
    waitUntil: "domcontentloaded",
  });
}

test.describe("collaboration route gates", () => {
  test("anonymous consultation redirects to login", async ({ page }) => {
    await page.goto("/consultations/00000000-0000-0000-0000-000000000001");
    await expect(page).toHaveURL(/\/login/);
  });

  test("anonymous broker request redirects to login", async ({ page }) => {
    await page.goto("/broker/requests/00000000-0000-0000-0000-000000000001");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("collaboration authenticated", () => {
  test.skip(!process.env.ATLAS_BROKER_E2E_RUN_ID, "Requires seeded broker E2E users");

  test("broker lands in workspace dashboard", async ({ page }) => {
    await login(page, "broker-a");
    await expect(page).toHaveURL(/\/broker\/dashboard/);
  });

  test("broker B cannot open arbitrary broker request if not assigned", async ({
    page,
  }) => {
    await login(page, "broker-b");
    await page.goto("/broker/requests/00000000-0000-0000-0000-000000000099");
    // notFound or redirect away from detail content
    await expect(page.getByText(/Cliente ATLAS|Nuova assegnazione/)).toHaveCount(0);
  });

  test("consumer consulting page exposes request CTA", async ({ page }) => {
    await login(page, "consumer");
    await page.goto("/consulting");
    await expect(page.getByText(/Richiedi revisione|Richiesta di revisione|Richiesta ricevuta/)).toBeVisible({
      timeout: 15_000,
    });
  });
});
