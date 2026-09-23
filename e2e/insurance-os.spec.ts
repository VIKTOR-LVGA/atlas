import { expect, test } from "@playwright/test";
import { getSafeAuthRedirect } from "../lib/auth-redirect";

test.describe("Insurance OS routes", () => {
  test("auth redirect allows atlas/activity/claims", () => {
    expect(getSafeAuthRedirect("/atlas")).toBe("/atlas");
    expect(getSafeAuthRedirect("/atlas/ask")).toBe("/atlas/ask");
    expect(getSafeAuthRedirect("/activity")).toBe("/activity");
    expect(getSafeAuthRedirect("/claims/new")).toBe("/claims/new");
    expect(getSafeAuthRedirect("/opportunities")).toBe("/opportunities");
  });

  test("unauthenticated product routes redirect to login", async ({ page }) => {
    await page.goto("/atlas");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/activity");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/claims/new");
    await expect(page).toHaveURL(/\/login/);
  });

  test("broker portal still 404", async ({ page }) => {
    const broker = await page.goto("/broker");
    expect(broker?.status()).toBe(404);
    const partner = await page.goto("/partner");
    expect(partner?.status()).toBe(404);
  });
});
