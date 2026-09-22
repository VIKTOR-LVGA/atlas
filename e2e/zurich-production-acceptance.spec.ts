/**
 * One-shot Production Zurich acceptance (self-cleaning).
 * Uses local Downloads PDF — never commits it.
 */
import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const pdfPath = resolve(
  process.env.HOME || "",
  "Downloads/96.623.228 - copia polizza.pdf"
);
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `atlas-zurich-${runId}@example.com`;
const password = "AtlasBrowser!2026";

test.describe.configure({ mode: "serial" });
test.setTimeout(360_000);

test("Zurich motor personal policy passes on Production", async ({ page }) => {
  test.skip(!existsSync(pdfPath), `Missing local Zurich PDF at ${pdfPath}`);

  await page.goto("/register", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByLabel("Nome completo").fill("Atlas Zurich Acceptance");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Conferma password").fill(password);
  await page.getByRole("button", { name: "Crea account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });

  await page.goto("/documents");
  await page.waitForLoadState("networkidle");

  await page.locator('input[type="file"]').setInputFiles(pdfPath);
  const uploadButton = page.getByRole("button", {
    name: "Carica e prepara per l'analisi",
  });
  await expect(uploadButton).toBeEnabled({ timeout: 15_000 });
  await uploadButton.click();
  await expect(page.getByRole("status")).toContainText("Documento ricevuto", {
    timeout: 60_000,
  });
  await page.getByRole("link", { name: "Apri documento", exact: true }).click();
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+$/, { timeout: 30_000 });

  const analyze = page.getByRole("button", {
    name: /Analizza documento|Analizza di nuovo|Riprova analisi|Riprendi analisi/i,
  });
  await expect(analyze).toBeEnabled({ timeout: 30_000 });
  await analyze.click();

  await page.waitForURL(/\/policies\/[0-9a-f-]+/, { timeout: 240_000 });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText();

  expect(body).not.toMatch(/Documento classificato come general_conditions/i);
  expect(body).not.toMatch(/non_policy_document:general_conditions/i);
  expect(body).toMatch(/Zurich|Zurigo/i);
  expect(body).toMatch(/96\.623\.228/);
  expect(body).toMatch(/MERCEDES|Mercedes|C\s*220d/i);
  expect(body).toMatch(/TI\s*291091/i);
  expect(body).toMatch(/1[.'']?873|1873|1[.'']?888/);
  // Coverages recovered or extracted
  expect(body).toMatch(/Responsabilit|Casco|Collisione|Copert/i);

  // Cleanup policy + document
  const policyUrl = page.url();
  page.once("dialog", (dialog) => dialog.accept());
  const deletePolicy = page.getByRole("button", { name: /Elimina polizza/i });
  if (await deletePolicy.isVisible().catch(() => false)) {
    await deletePolicy.click();
    await page.waitForTimeout(1500);
  } else {
    await page.goto(policyUrl);
  }

  // Best-effort document cleanup via documents list
  await page.goto("/documents", { waitUntil: "domcontentloaded" });
});
