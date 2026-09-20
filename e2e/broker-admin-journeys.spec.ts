import { expect, test, type Page } from "@playwright/test";

const runId = process.env.ATLAS_BROKER_E2E_RUN_ID ?? "20260920b";
const password = "AtlasBroker!2026Aa";
const email = (role: "consumer" | "broker-a" | "broker-b" | "admin") => `atlas-${role}-${runId}@example.com`;

async function login(page: Page, role: "consumer" | "broker-a" | "broker-b" | "admin") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email(role));
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/(dashboard|broker|admin)/, { timeout: 20_000 });
}

test.describe("operations access boundaries", () => {
  test("anonymous broker route redirects to login", async ({ page }) => {
    await page.goto("/broker");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("anonymous admin route redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("consumer cannot open broker workspace", async ({ page }) => {
    await login(page, "consumer");
    await page.goto("/broker");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("consumer cannot open admin control plane", async ({ page }) => {
    await login(page, "consumer");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("broker A workspace", () => {
  test.beforeEach(async ({ page }) => login(page, "broker-a"));

  test("broker login lands in its dedicated portal", async ({ page }) => {
    await page.goto("/broker");
    await expect(page.getByRole("heading", { name: /Buongiorno, Broker A Live/ })).toBeVisible();
  });

  test("broker navigation does not mix consumer modules", async ({ page }) => {
    await page.goto("/broker");
    await expect(page.getByRole("navigation", { name: "Broker Workspace navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Documenti" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Raccomandazioni" })).toHaveCount(0);
  });

  test("broker sees assigned lead in pipeline", async ({ page }) => {
    await page.goto("/broker/leads");
    await expect(page.getByRole("link", { name: `ATLAS consumer ${runId}` })).toBeVisible();
    await expect(page.getByText("won", { exact: true })).toBeVisible();
  });

  test("broker opens assigned lead detail", async ({ page }) => {
    await page.goto("/broker/leads");
    await page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click();
    await expect(page.getByRole("heading", { name: `ATLAS consumer ${runId}` })).toBeVisible();
    await expect(page.getByText(email("consumer"), { exact: true })).toBeVisible();
  });

  test("broker sees explicitly shared policy", async ({ page }) => {
    await page.goto("/broker/leads");
    await page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click();
    await expect(page.getByText(/Shared Helvetia/)).toBeVisible();
  });

  test("broker does not see unshared policy", async ({ page }) => {
    await page.goto("/broker/leads");
    await page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click();
    await expect(page.getByText(/Private Zurich/)).toHaveCount(0);
  });

  test("broker sees shared document but not private document", async ({ page }) => {
    await page.goto("/broker/leads");
    await page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click();
    await expect(page.getByText(`shared-${runId}.pdf`, { exact: true })).toBeVisible();
    await expect(page.getByText(`private-${runId}.pdf`, { exact: true })).toHaveCount(0);
  });

  test("broker detail includes operational audit trail", async ({ page }) => {
    await page.goto("/broker/leads");
    await page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click();
    await expect(page.getByText("broker_assigned", { exact: true })).toBeVisible();
    await expect(page.getByText("contract_active", { exact: true })).toBeVisible();
    await expect(page.getByText("commission_clawback", { exact: true })).toBeVisible();
  });

  test("broker commission page exposes only broker economics", async ({ page }) => {
    await page.goto("/broker/commissions");
    await expect(page.getByRole("heading", { name: "Commissioni" })).toBeVisible();
    await expect(page.getByText("CHF 509.97", { exact: false })).toBeVisible();
    await expect(page.getByText("Revenue ATLAS", { exact: true })).toHaveCount(0);
  });

  test("broker is redirected away from consumer area", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/broker$/);
  });

  test("broker is denied the admin portal", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/broker$/, { timeout: 20_000 });
  });
});

test.describe("broker B isolation", () => {
  test.beforeEach(async ({ page }) => login(page, "broker-b"));

  test("broker B pipeline does not contain broker A client", async ({ page }) => {
    await page.goto("/broker/leads");
    await expect(page.getByRole("link", { name: `ATLAS consumer ${runId}` })).toHaveCount(0);
  });

  test("broker B has no commission ledger rows from broker A", async ({ page }) => {
    await page.goto("/broker/commissions");
    await expect(page.getByText("Live Insurer", { exact: false })).toHaveCount(0);
    await expect(page.getByText("CHF 0.00", { exact: false }).first()).toBeVisible();
  });
});

test.describe("admin control plane", () => {
  test.beforeEach(async ({ page }) => login(page, "admin"));

  test("admin opens dedicated control plane", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Broker & Revenue" })).toBeVisible();
  });

  test("admin sees both broker identities", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("#brokers span.font-semibold").filter({ hasText: "Broker A Live" }).first()).toBeVisible();
    await expect(page.locator("#brokers span.font-semibold").filter({ hasText: "Broker B Live" }).first()).toBeVisible();
  });

  test("admin sees the assigned won request", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("form").filter({ hasText: "portfolio_review" }).filter({ hasText: "won" }).first()).toBeVisible();
  });

  test("admin sees gross and ATLAS revenue metrics", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Commissioni lorde", { exact: true })).toBeVisible();
    await expect(page.getByText("Revenue ATLAS", { exact: true })).toBeVisible();
  });

  test("admin sees historical commission ledger", async ({ page }) => {
    await page.goto("/admin");
    const ledger = page.locator("section").filter({ has: page.getByRole("heading", { name: "Ledger ricavi" }) });
    await expect(ledger.getByText(/Live Insurer · Live Protect/).first()).toBeVisible();
    await expect(ledger.getByText(/CHF\s*999\.95/).first()).toBeVisible();
  });

  test("admin is redirected away from consumer area", async ({ page }) => {
    await page.goto("/policies");
    await expect(page).toHaveURL(/\/admin$/);
  });
});
