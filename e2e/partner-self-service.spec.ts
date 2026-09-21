import { expect, test, type Page } from "@playwright/test";

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

async function login(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/(dashboard|partner|control-center)/, { timeout: 30_000 });
}

async function logoutFromOperations(page: Page) {
  await page.getByRole("button", { name: "Esci" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
}

test("partner self-service registration, approval, activation and suspension", async ({
  page,
}) => {
  test.setTimeout(180_000);

  await page.goto("/register");
  await page.getByText("Partner / Broker", { exact: true }).click();
  await page.getByLabel("Nome completo").fill(partner.fullName);
  await page.getByLabel("Email").fill(partner.email);
  await page.getByLabel("Password", { exact: true }).fill(partner.password);
  await page.getByLabel("Conferma password").fill(partner.password);
  await page.getByRole("button", { name: "Crea account e continua" }).click();
  await expect(page).toHaveURL(/\/partner\/apply$/, { timeout: 30_000 });

  await page.getByLabel("Nome", { exact: true }).fill(partner.firstName);
  await page.getByLabel("Cognome", { exact: true }).fill(partner.lastName);
  await page.getByLabel("Società", { exact: true }).fill(partner.organization);
  await page.getByLabel("Ragione sociale").fill(`${partner.organization} SA`);
  await page.getByLabel("Email professionale").fill(partner.email);
  await page.getByLabel("Telefono").fill("+41790000001");
  await page.getByLabel("Tipo partner").selectOption("brokerage_company");
  await page.getByLabel("Cantone principale").selectOption("TI");
  await page.getByRole("checkbox", { name: "Ticino", exact: true }).check();
  await page.getByLabel(/Acconsento al trattamento/).check();
  await page.getByLabel(/Accetto le condizioni Partner/).check();
  await page.getByLabel(/Dichiaro che le informazioni/).check();
  await page.getByRole("button", { name: "Invia candidatura" }).click();
  await expect(page).toHaveURL(/\/partner\/status$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "In revisione" })).toBeVisible();
  await expect(page.getByText(partner.organization, { exact: true })).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Menu account" }).click();
  await page.getByRole("menuitem", { name: "Esci" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });

  await login(page, adminEmail, adminPassword);
  await page.goto("/control-center/partners");
  const applicationHref = await page
    .getByRole("link", { name: partner.fullName, exact: true })
    .getAttribute("href");
  expect(applicationHref).toMatch(/^\/control-center\/partners\/applications\//);
  await page.goto(applicationHref!);
  await expect(page).toHaveURL(/\/control-center\/partners\/applications\//);
  await page.getByRole("button", { name: "In revisione" }).click();
  await page.getByRole("button", { name: "Approva" }).click();
  await expect(page.getByRole("button", { name: "Sospendi" })).toBeVisible({
    timeout: 30_000,
  });
  await logoutFromOperations(page);

  await login(page, partner.email, partner.password);
  await expect(page).toHaveURL(/\/partner\/dashboard$/, { timeout: 30_000 });
  await page.goto("/partner/profile");
  await expect(page.getByRole("heading", { name: partner.fullName })).toBeVisible();
  await logoutFromOperations(page);

  await login(page, adminEmail, adminPassword);
  await page.goto("/control-center/partners");
  const partnerRow = page
    .getByRole("link", { name: partner.fullName, exact: true })
    .locator("../..");
  await partnerRow.getByRole("button", { name: "Sospendi" }).click();
  const suspendedRow = page.getByText(partner.fullName, { exact: true }).locator("..");
  const reactivateButton = suspendedRow.getByRole("button", { name: "Riattiva" });
  await expect(reactivateButton).toBeVisible({
    timeout: 30_000,
  });
  await logoutFromOperations(page);

  await login(page, partner.email, partner.password);
  await expect(page).toHaveURL(/\/partner\/status$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Sospesa" })).toBeVisible();
  await page.getByRole("link", { name: "Torna all'account ATLAS" }).click();
  await page.getByRole("button", { name: "Menu account" }).click();
  await page.getByRole("menuitem", { name: "Esci" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });

  await login(page, adminEmail, adminPassword);
  await page.goto("/control-center/partners");
  await page
    .getByText(partner.fullName, { exact: true })
    .locator("..")
    .getByRole("button", { name: "Riattiva" })
    .click();
  await logoutFromOperations(page);

  await login(page, partner.email, partner.password);
  await expect(page).toHaveURL(/\/partner\/dashboard$/, { timeout: 30_000 });
  await logoutFromOperations(page);

  // Keep the generated test identity inert after the lifecycle has been verified.
  await login(page, adminEmail, adminPassword);
  await page.goto("/control-center/partners");
  await page
    .getByRole("link", { name: partner.fullName, exact: true })
    .locator("../..")
    .getByRole("button", { name: "Sospendi" })
    .click();
});
