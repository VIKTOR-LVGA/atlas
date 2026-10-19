import { expect, test } from "@playwright/test";
import { getSafeAuthRedirect } from "../lib/auth-redirect";

test.describe("Insurance OS routes", () => {
  test("auth redirect allows atlas/activity/claims", () => {
    expect(getSafeAuthRedirect("/atlas")).toBe("/atlas");
    expect(getSafeAuthRedirect("/atlas/ask")).toBe("/atlas/ask");
    expect(getSafeAuthRedirect("/activity")).toBe("/activity");
    expect(getSafeAuthRedirect("/claims/new")).toBe("/claims/new");
    expect(getSafeAuthRedirect("/search?q=franchise")).toBe(
      "/search?q=franchise"
    );
    expect(getSafeAuthRedirect("/opportunities")).toBe("/opportunities");
  });

  test("unauthenticated product routes redirect to login", async ({ page }) => {
    await page.goto("/atlas");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/atlas");
    await page.goto("/activity");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/activity");
    await page.goto("/claims/new");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/claims/new");
    await page.goto("/search?q=franchise");
    expect(new URL(page.url()).searchParams.get("next")).toBe(
      "/search?q=franchise"
    );
  });

  test("broker portal is explicitly unavailable", async ({ page }) => {
    const broker = await page.goto("/broker");
    expect(broker?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/broker-unavailable$/);
    const partner = await page.goto("/partner");
    expect(partner?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/broker-unavailable$/);
  });
});
