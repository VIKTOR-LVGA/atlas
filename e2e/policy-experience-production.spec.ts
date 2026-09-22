import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const pdfPath = resolve(
  process.env.HOME || "",
  "Downloads/96.623.228 - copia polizza.pdf"
);
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const email = `atlas-pe3-${runId}@example.com`;
const password = "AtlasBrowser!2026";

test.describe.configure({ mode: "serial" });
test.setTimeout(360_000);

test("Policy Experience 3.0 Zurich tabs on Production", async ({ page }) => {
  test.skip(!existsSync(pdfPath), `Missing Zurich PDF at ${pdfPath}`);

  await page.goto("/register", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.getByLabel("Nome completo").fill("Atlas PE3 QA");
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
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+$/);
  await page
    .getByRole("button", { name: /Analizza documento|Analizza di nuovo|Riprova analisi/i })
    .click();
  await page.waitForURL(/\/policies\/[0-9a-f-]+/, { timeout: 240_000 });

  // Tabs present
  await expect(page.getByRole("navigation", { name: "Sezioni polizza" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Panoramica" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Coperture" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Verifica dati" })).toBeVisible();

  const overview = await page.locator("body").innerText();
  // Plate should not be duplicated as two identical labeled blocks in overview
  const plateLabelCount = (overview.match(/\bTarga\b/gi) || []).length;
  expect(plateLabelCount).toBeLessThanOrEqual(2);

  await page.getByRole("link", { name: "Coperture" }).click();
  await expect(page).toHaveURL(/view=coverages/);
  const coverages = await page.locator("body").innerText();
  expect(coverages).toMatch(/Coperto|Non coperto|Copert/i);

  await page.getByRole("link", { name: "Verifica dati" }).click();
  await expect(page).toHaveURL(/view=review/);
  await expect(page.getByText(/Completezza dati estratti/i)).toBeVisible();

  await page.goto("/opportunities");
  await expect(page.getByRole("heading", { name: "Opportunità" })).toBeVisible();
  await expect(page.getByText(/Nessuna stima di risparmio|campione|interventi prioritari|Da valutare|In analisi/i).first()).toBeVisible();
});
