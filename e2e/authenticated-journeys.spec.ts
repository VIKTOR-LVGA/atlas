import { expect, test, type Page } from "@playwright/test";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const account = {
  fullName: "Atlas Browser E2E",
  email: `atlas-browser-${runId}@example.com`,
  password: "AtlasBrowser!2026",
};

let policyId = "";
let documentId = "";

async function login(page: Page, password = account.password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
}

test.describe.serial("Atlas authenticated journeys", () => {
  test("register creates a live session and opens the dashboard", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Nome completo").fill(account.fullName);
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByLabel("Conferma password").fill(account.password);
    await page.getByRole("button", { name: "Crea account" }).click();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Buongiorno|Buon pomeriggio|Buonasera/
    );
    await expect(page.getByText("Il tuo mondo assicurativo")).toBeVisible();
  });

  test("invalid password is rejected and valid login persists", async ({ page }) => {
    await login(page, "WrongPassword!2026");
    await expect(
      page.getByText("Email o password non corretti.", { exact: true })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Password").fill(account.password);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("profile is created and updates persist after refresh", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await page.goto("/settings");

    const updatedName = "Atlas Browser E2E Updated";
    await page.getByLabel("Nome completo").fill(updatedName);
    await page.getByLabel("Telefono").fill("+41 79 000 00 00");
    await page.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(page.getByRole("status")).toContainText(/salvat/i);

    await page.reload();
    await expect(page.getByLabel("Nome completo")).toHaveValue(updatedName);
    await expect(page.getByLabel("Telefono")).toHaveValue("+41 79 000 00 00");
  });

  test("household people, homes and vehicles support create and edit", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await page.goto("/settings");

    await page.getByRole("button", { name: "Aggiungi persona" }).click();
    await page.getByLabel("Nome persona", { exact: true }).fill("Giulia");
    await page.getByLabel("Cognome persona").fill("Browser");
    await page.getByLabel("Relazione").selectOption("partner");
    await page.getByRole("button", { name: "Salva persona" }).click();
    await expect(page.getByRole("status")).toContainText("Membro aggiunto");
    await expect(page.getByText("Giulia Browser", { exact: true })).toBeVisible();

    const personRow = page.locator("li").filter({ hasText: "Giulia Browser" });
    await personRow.getByRole("button", { name: "Modifica" }).click();
    await page.getByLabel("Cognome persona").fill("Browser Updated");
    await page.getByRole("button", { name: "Salva persona" }).click();
    await expect(page.getByText("Giulia Browser Updated", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Aggiungi casa" }).click();
    await page.getByLabel("Nome abitazione", { exact: true }).fill("Casa Browser");
    await page.getByLabel("Città abitazione").fill("Lugano");
    await page.getByLabel("NPA abitazione").fill("6900");
    await page.getByRole("button", { name: "Salva casa" }).click();
    await expect(page.getByText("Casa Browser", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Aggiungi veicolo" }).click();
    await page.getByLabel("Nome veicolo", { exact: true }).fill("Auto Browser");
    await page.getByLabel("Marca veicolo").fill("Volvo");
    await page.getByLabel("Targa veicolo").fill("TI 123456");
    await page.getByRole("button", { name: "Salva veicolo" }).click();
    await expect(page.getByText("Auto Browser", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText("Giulia Browser Updated", { exact: true })).toBeVisible();
    await expect(page.getByText("Casa Browser", { exact: true })).toBeVisible();
    await expect(page.getByText("Auto Browser", { exact: true })).toBeVisible();
  });

  test("policy can be created and read", async ({ page }) => {
    test.setTimeout(45_000);
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await page.goto("/policies/new");
    await page.getByRole("button", { name: "RC privata" }).click();
    await page.getByRole("button", { name: "Continua" }).click();
    await page.getByLabel("Compagnia").fill("Helvetia Browser E2E");
    await page.getByLabel("Numero polizza").fill(`E2E-${runId}`);
    await page.getByRole("button", { name: "Continua" }).click();
    await page.getByLabel("Premio", { exact: true }).fill("240");
    await page.getByLabel("Frequenza premio").selectOption("annual");
    await page.getByRole("button", { name: "Salva e completa dopo" }).click();

    await expect(page).toHaveURL(/\/policies\/[0-9a-f-]+$/, { timeout: 20_000 });
    policyId = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(policyId).not.toBe("");
    await expect(
      page.getByRole("heading", { name: "Helvetia Browser E2E", exact: true })
    ).toBeVisible();
  });

  test("policy can be edited", async ({ page }) => {
    expect(policyId).not.toBe("");
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await page.goto(`/policies/${policyId}/edit`);
    await page.getByLabel("Compagnia").fill("Helvetia Browser E2E Updated");
    await page.getByLabel("Premio", { exact: true }).fill("260");
    await page.getByRole("button", { name: "Salva modifiche" }).click();

    await expect(page).toHaveURL(new RegExp(`/policies/${policyId}\\?saved=1$`), {
      timeout: 20_000,
    });
    await expect(
      page.getByRole("heading", {
        name: "Helvetia Browser E2E Updated",
        exact: true,
      })
    ).toBeVisible();
  });

  test("policies list, opportunities, wallet and mobile nav work", async ({ page }) => {
    expect(policyId).not.toBe("");
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    await page.goto("/policies");
    await expect(page.getByRole("heading", { name: "Le mie polizze" })).toBeVisible();
    await expect(page.getByText("Helvetia Browser E2E Updated", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Apri" }).first()).toBeVisible();

    await page.goto(`/policies/${policyId}`);
    await expect(page.getByText("Overview")).toBeVisible();
    await expect(page.getByText("Costi")).toBeVisible();

    await page.goto("/opportunities");
    await expect(page.getByRole("heading", { name: "Opportunità" })).toBeVisible();
    await expect(page.getByText("Controlla polizza").first()).toBeVisible();
    await page.getByRole("button", { name: "Segna come vista" }).first().click();
    await expect(page.getByRole("status").first()).toContainText("letta");
    await page.getByRole("button", { name: "Archivia" }).first().click();
    await expect(page.getByRole("status").first()).toContainText("archiviata");

    await page.goto("/documents");
    await expect(page.getByRole("heading", { name: "Wallet documenti" })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    const mobileNav = page.getByRole("navigation", { name: "Navigazione principale" });
    await expect(mobileNav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Polizze" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Opportunità" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Profilo" })).toBeVisible();
  });

  test("consultation request requires consent and persists", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await page.goto("/consulting");
    await page.getByLabel("Modalita di contatto").selectOption("email");
    await page.getByLabel("Messaggio facoltativo").fill("Richiesta browser E2E");
    await page.getByLabel("Consenso alla revisione").check();
    await page.getByRole("button", { name: "Richiedi revisione gratuita" }).click();
    await expect(page.getByTestId("consultation-confirmation")).toContainText(
      "Richiesta ricevuta"
    );
    await page.reload();
    await expect(page.getByTestId("consultation-confirmation")).toContainText(
      "Richiesta ricevuta"
    );
  });

  test("document can be uploaded, read, and downloaded", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="file"]').setInputFiles({
      name: `atlas-browser-${runId}.pdf`,
      mimeType: "application/pdf",
      buffer: Buffer.from(
        "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
      ),
    });
    const uploadButton = page.getByRole("button", {
      name: "Carica e prepara per l'analisi",
    });
    await expect(uploadButton).toBeEnabled({ timeout: 15_000 });
    await uploadButton.click();
    await expect(page.getByRole("status")).toContainText("Documento ricevuto", {
      timeout: 20_000,
    });
    await page.getByRole("link", { name: "Apri documento", exact: true }).click();
    await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+$/);
    documentId = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(documentId).not.toBe("");

    const response = await page.request.get(`/documents/${documentId}/download`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/pdf");
  });

  test("policy and document can be deleted", async ({ page }) => {
    expect(policyId).not.toBe("");
    expect(documentId).not.toBe("");
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    await page.goto(`/policies/${policyId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Elimina polizza" }).click();
    await expect(page).toHaveURL(/\/policies$/, { timeout: 20_000 });
    await expect(page.getByText("Helvetia Browser E2E Updated", { exact: true })).toHaveCount(0);

    await page.goto(`/documents/${documentId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTitle("Elimina documento").click();
    await expect(page).toHaveURL(/\/documents$/, { timeout: 20_000 });
    await page.goto(`/documents/${documentId}`);
    await expect(page).toHaveURL(/\/not-found|\/404|\/documents\//);
    await expect(page.getByText("Pagina non trovata", { exact: false })).toBeVisible();

    await page.goto("/settings");
    for (const label of ["Giulia Browser Updated", "Casa Browser", "Auto Browser"]) {
      const row = page.locator("li").filter({ hasText: label });
      await row.getByRole("button", { name: "Elimina" }).click();
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
  });

  test("logout clears the session and protected routes remain blocked", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await page.getByRole("button", { name: "Menu account" }).click();
    await page.getByRole("menuitem", { name: "Esci" }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(new URL(page.url()).searchParams.get("next")).toBe("/dashboard");
  });
});
