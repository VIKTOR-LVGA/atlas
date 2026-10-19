import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

const stagingEnabled = process.env.ATLAS_STAGING_E2E === "1";
const productionEnabled = process.env.ATLAS_PRODUCTION_E2E === "1";
const enabled = stagingEnabled || productionEnabled;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const adminKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const stagingRef = process.env.ATLAS_STAGING_PROJECT_REF ?? "";
const productionRef = "ycjltpxxetxvuptwlxlr";
const configuredRunId = process.env.ATLAS_E2E_RUN_ID?.trim() ?? "";
const runId = productionEnabled
  ? configuredRunId
  : configuredRunId || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const password = `Atlas!${randomBytes(18).toString("base64url")}Aa1`;
const accounts = {
  owner: {
    fullName: `Atlas QA Owner ${runId}`,
    email: `atlas-e2e-owner-${runId}@example.com`,
  },
  stranger: {
    fullName: `Atlas QA Stranger ${runId}`,
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
let incompletePolicyId = "";
let incompleteDocumentId = "";

function getProjectRef() {
  try {
    return new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    return "";
  }
}

function assertControlledConfiguration() {
  const ref = getProjectRef();

  expect(stagingEnabled && productionEnabled).toBe(false);
  expect(publishableKey).not.toBe("");
  expect(adminKey).not.toBe("");
  expect(process.env.ATLAS_CLEANUP_AFTER).toBe("1");

  if (productionEnabled) {
    expect(ref).toBe(productionRef);
    expect(process.env.ATLAS_ALLOW_PROD_FIXTURES).toBe("1");
    expect(process.env.ATLAS_PROD_BACKUP_VERIFIED).toBe("1");
    expect(runId).toMatch(/^prod-[a-z0-9][a-z0-9-]{7,47}$/);
    return;
  }

  expect(supabaseUrl).not.toContain(productionRef);
  expect(stagingRef).not.toBe("");
  expect(ref).toBe(stagingRef);
}

function makeAdminClient() {
  return createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function listFixtureUsers(admin: ReturnType<typeof makeAdminClient>) {
  const fixtureEmails = new Set(
    Object.values(accounts).map((account) => account.email)
  );
  const matches = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    matches.push(
      ...data.users.filter((user) => fixtureEmails.has(user.email ?? ""))
    );
    if (data.users.length < 1000) break;
  }

  return matches;
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

async function login(page: Page, account: (typeof accounts)["owner"]) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
}

async function openSession(page: Page, account: (typeof accounts)["owner"]) {
  if (productionEnabled) {
    await login(page, account);
  } else {
    await register(page, account);
  }
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

test.describe.serial("ATLAS real controlled journey", () => {
  test.skip(
    !enabled,
    "Requires an explicitly enabled staging or controlled Production environment"
  );

  test.beforeAll(async () => {
    assertControlledConfiguration();
    if (!productionEnabled) return;

    const admin = makeAdminClient();
    expect(await listFixtureUsers(admin)).toHaveLength(0);

    for (const account of Object.values(accounts)) {
      const { error } = await admin.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: account.fullName,
          atlas_e2e_run_id: runId,
        },
      });
      if (error) throw error;
    }
  });

  test.afterAll(async () => {
    if (!enabled || !adminKey || !supabaseUrl) return;

    const admin = makeAdminClient();
    const fixtureUsers = await listFixtureUsers(admin);

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

      for (const table of ["atlas_product_events", "intelligence_query_audit"]) {
        const { error: childDeleteError } = await admin
          .from(table)
          .delete()
          .eq("user_id", user.id);
        if (childDeleteError) throw childDeleteError;
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;

      for (const table of ["policies", "documents"]) {
        const { count, error: residueError } = await admin
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (residueError) throw residueError;
        expect(count).toBe(0);
      }

      const { data: remainingFiles, error: remainingFilesError } = await admin.storage
        .from("policy-documents")
        .list(user.id, { limit: 1 });
      if (remainingFilesError) throw remainingFilesError;
      expect(remainingFiles).toHaveLength(0);
    }
  });

  test("account access → mobile upload → OpenAI → review → dashboard → Ask ATLAS → isolation", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await openSession(page, accounts.owner);

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

    incompleteDocumentId = await uploadPdf(page, incompleteFixture);
    await page.getByRole("button", { name: "Analizza documento" }).click();
    await expect(page).toHaveURL(/\/policies\/[0-9a-f-]+$/, {
      timeout: 120_000,
    });
    incompletePolicyId = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(incompletePolicyId).not.toBe("");
    await expect(page.getByText(/Premio non ancora indicato/i)).toBeVisible();
    expect(incompleteDocumentId).not.toBe(ownerDocumentId);

    await logout(page);
    await openSession(page, accounts.stranger);
    await page.goto(`/policies/${ownerPolicyId}`);
    await expect(page.getByText("Pagina non trovata", { exact: false })).toBeVisible();
    await page.goto(`/documents/${ownerDocumentId}`);
    await expect(page.getByText("Pagina non trovata", { exact: false })).toBeVisible();
  });
});
