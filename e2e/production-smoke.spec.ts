import { expect, test } from "@playwright/test";

const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
] as const;

for (const viewport of viewports) {
  test(`public production smoke ${viewport.name}`, async ({ page }) => {
    test.setTimeout(60_000);
    const consoleErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 500) {
        serverErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of ["/", "/register", "/intelligence"]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        )
      ).toBe(true);
    }

    const brokerResponse = await page.goto("/broker", {
      waitUntil: "domcontentloaded",
    });
    expect(brokerResponse?.status()).toBe(404);

    expect(serverErrors).toEqual([]);
    // Ignore only the intentional /broker 404 console noise from this smoke check.
    expect(
      consoleErrors.filter(
        (msg) =>
          !(
            /Failed to load resource: the server responded with a status of 404/i.test(
              msg
            ) && /\/broker(?:\?|$|\/)/i.test(page.url())
          )
      )
    ).toEqual([]);
  });
}
