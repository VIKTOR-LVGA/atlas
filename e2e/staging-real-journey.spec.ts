import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";

const enabled = process.env.ATLAS_STAGING_E2E === "1";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const stagingRef = process.env.ATLAS_STAGING_PROJECT_REF ?? "";
const productionRef = "ycjltpxxetxvuptwlxlr";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const password = "AtlasStaging!2026";
const accounts = {
  owner: {
    fullName: "Atlas Staging Owner",
    email: `atlas-e2e-owner-${runId}@example.com`,
  },
  stranger: {
    fullName: "Atlas Staging Stranger",
    email: `atlas-e2e-stranger-${runId}@example.com`,
  },
};
const completeFixture = resolve(
  process.cwd(),
  "e2e/fixtures/swiss-motor-policy-synthetic.pdf"
);
const incompleteFixture = resolve(
  process.cwd(),
  "e2e/fixtures/swiss-policy-incomplete-synthetic.pdf"
);

let ownerPolicyId = "";
let ownerDocumentId = "";

function assertStagingConfiguration() {
  const ref = (() => {
    try {
      return new URL(supabaseUrl).hostname.split(".")[0];
    } catch {
      return "";
    }
  })();

  expect(supabaseUrl).not.toContain(productionRef);
  expect(stagingRef).not.toBe("");
  expect(ref).toBe(stagingRef);
  expect(publishableKey).not.toBe("");
  expect(serviceRoleKey).not.toBe("");
  expect(process.env.ATLAS_CLEANUP_AFTER).toBe("1");
}

async function register(page: Page, account: (typeof accounts)["owner"]) {
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Nome completo").fill(account.fullName);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Conferma password").fill(password);
  await page.getByRole("button", { name: "Crea account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Menu account" }).click();
  await page.getByRole("menuitem", { name: "Esci" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
}

async function uploadPdf(page: Page, path: string) {
  await page.goto("/documents", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="file"]').setInputFiles(path);
  await page
    .getByRole("button", { name: "Carica e prepara per l'analisi" })
    .click();
  await expect(page.getByRole("status")).toContainText("Documento ricevuto", {
    timeout: 30_000,
  });
  await page.getByRole("link", { name: "Apri documento", exact: true }).click();
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+$/);
  return new URL(page.url()).pathname.split("/").pop() ?? "";
}

test.describe.serial("ATLAS real staging journey", () => {
  test.skip(!enabled, "Requires ATLAS_STAGING_E2E=1 and an isolated staging project");

  test.beforeAll(() => {
    assertStagingConfiguration();
  });

  test.afterAll(async () => {
    if (!enabled || !serviceRoleKey || !supabaseUrl) return;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) throw error;

    const fixtureEmails = new Set(
      Object.values(accounts).map((account) => account.email)
    );
    const fixtureUsers = data.users.filter((user) =>
      fixtureEmails.has(user.email ?? "")
    );

    for (const user of fixtureUsers) {
      const { data: files, error: listError } = await admin.storage
        .from("policy-documents")
        .list(user.id, { limit: 1000 });
      if (listError) throw listError;
      if (files.length > 0) {
        const { error: removeError } = await admin.storage
          .from("policy-documents")
          .remove(files.map((file) => `${user.id}/${file.name}`));
        if (removeError) throw removeError;
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
    }
  });

  test("registration → mobile upload → OpenAI → review → dashboard → Ask ATLAS → isolation", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await register(page, accounts.owner);

    await page.setViewportSize({ width: 390, height: 844 });
    ownerDocumentId = await uploadPdf(page, completeFixture);
    expect(ownerDocumentId).not.toBe("");

    await page.getByRole("button", { name: "Analizza documento" }).click();
    await expect(page).toHaveURL(/\/policies\/[0-9a-f-]+$/, {
      timeout: 120_000,
    });
    ownerPolicyId = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(ownerPolicyId).not.toBe("");
    await expect(page.getByText(/CHF\s*864(?:\.00)?/).first()).toBeVisible();

    await page.goto(`/policies/${ownerPolicyId}/edit`);
    await expect(page.getByLabel("Compagnia")).toHaveValue(/Alpina/i);
    await expect(page.getByLabel("Numero polizza")).toHaveValue(
      "SYN-MOTOR-2026-0001"
    );
    await expect(page.getByLabel("Premio", { exact: true })).toHaveValue("864");
    await expect(page.getByLabel("Frequenza premio")).toHaveValue("annual");
    await page.getByRole("button", { name: "Conferma polizza" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/policies/${ownerPolicyId}\\?confirmed=1$`),
      { timeout: 30_000 }
    );
    await expect(page.getByRole("status")).toContainText("Polizza confermata");

    await page.goto("/dashboard");
    await expect(page.getByText("Costo annuo noto", { exact: true })).toBeVisible();
    await expect(page.getByText(/CHF\s*864(?:\.00)?/).first()).toBeVisible();

    await page.goto("/atlas/ask");
    await page.getByLabel("La tua domanda").fill(
      "Quanto pago all'anno per la mia polizza auto e da quale documento proviene?"
    );
    await page.getByRole("button", { name: "Chiedi ad ATLAS" }).click();
    await expect(page.getByText(/CHF\s*864(?:\.00)?/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Fonti nei tuoi documenti")).toBeVisible();
    await expect(page.getByText(/SYN-MOTOR-2026-0001|Alpina/i).first()).toBeVisible();

    await page.goto("/documents");
    await page.locator('input[type="file"]').setInputFiles(completeFixture);
    await page
      .getByRole("button", { name: "Carica e prepara per l'analisi" })
      .click();
    await expect(page.getByRole("alert")).toContainText(/gia presente|già presente/i);

    const incompleteDocumentId = await uploadPdf(page, incompleteFixture);
    await page.getByRole("button", { name: "Analizza documento" }).click();
    await expect(page).toHaveURL(/\/policies\/[0-9a-f-]+$/, {
      timeout: 120_000,
    });
    await expect(page.getByText(/Premio non ancora indicato/i)).toBeVisible();
    expect(incompleteDocumentId).not.toBe(ownerDocumentId);

    await logout(page);
    await register(page, accounts.stranger);
    await page.goto(`/policies/${ownerPolicyId}`);
    await expect(page.getByText("Pagina non trovata", { exact: false })).toBeVisible();
    await page.goto(`/documents/${ownerDocumentId}`);
    await expect(page.getByText("Pagina non trovata", { exact: false })).toBeVisible();
  });
});
