import { expect, test, type Page } from "@playwright/test";

const runId = process.env.ATLAS_BROKER_E2E_RUN_ID ?? "20260920b";
const password = "AtlasBroker!2026Aa";
const email = (role: "consumer" | "broker-a" | "broker-b" | "admin") =>
  `atlas-${role}-${runId}@example.com`;

async function login(page: Page, role: "consumer" | "broker-a" | "broker-b" | "admin") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email(role));
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/(dashboard|partner|control-center|broker|admin)/, {
    timeout: 20_000,
  });
}

test.describe("operations access boundaries", () => {
  test("anonymous partner route redirects to login", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("anonymous control center redirects to login", async ({ page }) => {
    await page.goto("/control-center");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("legacy broker route redirects anonymous to login", async ({ page }) => {
    await page.goto("/broker");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("legacy admin route redirects anonymous to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("consumer cannot open partner portal", async ({ page }) => {
    await login(page, "consumer");
    await page.goto("/partner/dashboard");
    await expect(page).toHaveURL(/\/(partner\/status|partner\/apply|dashboard)/);
  });

  test("consumer cannot open control center", async ({ page }) => {
    await login(page, "consumer");
    await page.goto("/control-center");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("consumer legacy /broker denied", async ({ page }) => {
    await login(page, "consumer");
    await page.goto("/broker");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("public partner onboarding", () => {
  test("public partner landing is reachable", async ({ page }) => {
    await page.goto("/partner");
    await expect(page.getByRole("heading", { name: /Diventa partner ATLAS/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Richiedi accesso/i }).first()).toBeVisible();
  });
});

test.describe("broker A partner portal", () => {
  test.beforeEach(async ({ page }) => login(page, "broker-a"));

  test("broker login lands in partner portal", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await expect(page.getByRole("heading", { name: /Buongiorno, Broker A Live/ })).toBeVisible();
  });

  test("legacy /broker redirects into partner portal", async ({ page }) => {
    await page.goto("/broker");
    await expect(page).toHaveURL(/\/partner\/dashboard/);
    await expect(page.getByRole("heading", { name: /Buongiorno, Broker A Live/ })).toBeVisible();
  });

  test("partner navigation does not mix consumer modules", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await expect(page.getByRole("navigation", { name: "Partner Portal navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Documenti" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Raccomandazioni" })).toHaveCount(0);
  });

  test("broker sees assigned lead in pipeline", async ({ page }) => {
    await page.goto("/partner/leads");
    await expect(page.getByRole("link", { name: `ATLAS consumer ${runId}` })).toBeVisible();
    await expect(page.getByText("Conclusa", { exact: true })).toBeVisible();
  });

  test("broker opens assigned lead detail", async ({ page }) => {
    await page.goto("/partner/leads");
    await Promise.all([
      page.waitForURL(/\/partner\/leads\/[0-9a-f-]+/i),
      page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click(),
    ]);
    await expect(page.getByRole("heading", { name: `ATLAS consumer ${runId}` })).toBeVisible();
    await expect(page.getByText(email("consumer"), { exact: true })).toBeVisible();
  });

  test("broker sees explicitly shared policy", async ({ page }) => {
    await page.goto("/partner/leads");
    await Promise.all([
      page.waitForURL(/\/partner\/leads\/[0-9a-f-]+/i),
      page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click(),
    ]);
    await expect(page.getByText(/Shared Helvetia/)).toBeVisible();
  });

  test("broker does not see unshared policy", async ({ page }) => {
    await page.goto("/partner/leads");
    await Promise.all([
      page.waitForURL(/\/partner\/leads\/[0-9a-f-]+/i),
      page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click(),
    ]);
    await expect(page.getByText(/Private Zurich/)).toHaveCount(0);
  });

  test("broker sees shared document but not private document", async ({ page }) => {
    await page.goto("/partner/leads");
    await Promise.all([
      page.waitForURL(/\/partner\/leads\/[0-9a-f-]+/i),
      page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click(),
    ]);
    await expect(page.getByText(`shared-${runId}.pdf`, { exact: true })).toBeVisible();
    await expect(page.getByText(`private-${runId}.pdf`, { exact: true })).toHaveCount(0);
  });

  test("broker detail includes operational audit trail", async ({ page }) => {
    await page.goto("/partner/leads");
    await Promise.all([
      page.waitForURL(/\/partner\/leads\/[0-9a-f-]+/i),
      page.getByRole("link", { name: `ATLAS consumer ${runId}` }).click(),
    ]);
    await expect(page.getByText("Broker assegnato", { exact: true })).toBeVisible();
    await expect(page.getByText("Contratto attivo", { exact: true })).toBeVisible();
    await expect(page.getByText("Clawback registrato", { exact: true })).toBeVisible();
  });

  test("broker commission page exposes only broker economics", async ({ page }) => {
    await page.goto("/partner/commissions");
    await expect(page.getByRole("heading", { name: "Commissioni" })).toBeVisible();
    await expect(page.getByText("CHF 509.97", { exact: false })).toBeVisible();
    await expect(page.getByText("Revenue ATLAS", { exact: true })).toHaveCount(0);
  });

  test("broker is redirected away from consumer area", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/partner\/dashboard/);
  });

  test("broker is denied the control center", async ({ page }) => {
    await page.goto("/control-center");
    await expect(page).toHaveURL(/\/partner\/dashboard/, { timeout: 20_000 });
  });
});

test.describe("broker B isolation", () => {
  test.beforeEach(async ({ page }) => login(page, "broker-b"));

  test("broker B pipeline does not contain broker A client", async ({ page }) => {
    await page.goto("/partner/leads");
    await expect(page.getByRole("link", { name: `ATLAS consumer ${runId}` })).toHaveCount(0);
  });

  test("broker B has no commission ledger rows from broker A", async ({ page }) => {
    await page.goto("/partner/commissions");
    await expect(page.getByText("Live Insurer", { exact: false })).toHaveCount(0);
    await expect(page.getByText("CHF 0.00", { exact: false }).first()).toBeVisible();
  });
});

test.describe("control center", () => {
  test.beforeEach(async ({ page }) => login(page, "admin"));

  test("admin opens dedicated control center", async ({ page }) => {
    await page.goto("/control-center");
    await expect(page.getByRole("heading", { name: "Broker & Revenue" })).toBeVisible();
  });

  test("legacy /admin redirects to control center", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/control-center/);
    await expect(page.getByRole("heading", { name: "Broker & Revenue" })).toBeVisible();
  });

  test("admin sees both broker identities", async ({ page }) => {
    await page.goto("/control-center");
    await expect(
      page.locator("#brokers span.font-semibold").filter({ hasText: "Broker A Live" }).first()
    ).toBeVisible();
    await expect(
      page.locator("#brokers span.font-semibold").filter({ hasText: "Broker B Live" }).first()
    ).toBeVisible();
  });

  test("admin sees the assigned won request", async ({ page }) => {
    await page.goto("/control-center");
    await expect(
      page
        .locator("form")
        .filter({ hasText: "Revisione portafoglio" })
        .filter({ hasText: "Conclusa" })
        .first()
    ).toBeVisible();
  });

  test("admin sees gross and ATLAS revenue metrics", async ({ page }) => {
    await page.goto("/control-center");
    await expect(page.getByText("Commissioni lorde", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Revenue ATLAS", { exact: true }).first()).toBeVisible();
  });

  test("admin sees historical commission ledger", async ({ page }) => {
    await page.goto("/control-center");
    const ledger = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Ledger ricavi" }) });
    await expect(ledger.getByText(/Live Insurer · Live Protect/).first()).toBeVisible();
    await expect(ledger.getByText(/CHF\s*999\.95/).first()).toBeVisible();
  });

  test("admin is redirected away from consumer area", async ({ page }) => {
    await page.goto("/policies");
    await expect(page).toHaveURL(/\/control-center/);
  });

  test("admin can open users directory", async ({ page }) => {
    await page.goto("/control-center/users");
    await expect(page.getByRole("heading", { name: "Utenti piattaforma" })).toBeVisible();
  });

  test("admin can open partner management", async ({ page }) => {
    await page.goto("/control-center/partners");
    await expect(page.getByRole("heading", { name: "Partner e candidature" })).toBeVisible();
  });
});
