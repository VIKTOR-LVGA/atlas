import { expect, test } from "@playwright/test";

const responsiveViewports = [
  { width: 320, height: 760 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
] as const;

test.describe("ATLAS visual fidelity guardrails", () => {
  for (const viewport of responsiveViewports) {
    test(`landing has no document overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "networkidle" });

      const geometry = await page.evaluate(() => {
        const phone = document.querySelector<HTMLElement>(".atlas-ref-phone");
        const visual = document.querySelector<HTMLElement>(".atlas-ref-visual");
        const phoneRect = phone?.getBoundingClientRect();
        const visualRect = visual?.getBoundingClientRect();

        return {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          phoneWidth: phoneRect?.width ?? 0,
          visualWidth: visualRect?.width ?? 0,
        };
      });

      expect(geometry.scrollWidth).toBe(geometry.clientWidth);
      expect(geometry.phoneWidth).toBeGreaterThan(150);
      expect(geometry.phoneWidth).toBeLessThanOrEqual(320);
      expect(geometry.phoneWidth).toBeLessThan(geometry.visualWidth);
    });
  }

  test("public landing stays bright when the account preference is dark", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("atlas-theme", "dark"));
    await page.reload({ waitUntil: "networkidle" });

    const headerBackground = await page.locator(".landing-nav").evaluate((element) =>
      getComputedStyle(element).backgroundColor
    );
    const channels = headerBackground.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];

    expect(channels).toHaveLength(3);
    expect(channels.every((channel) => channel > 220)).toBe(true);
  });
});
