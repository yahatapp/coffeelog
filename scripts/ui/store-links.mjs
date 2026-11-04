import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve("apps/cafelog/package.json"));
const { expect } = require("@playwright/test");

export const storeLinkFixtures = [
  { url: "https://www.instagram.com/example/", label: "Instagram" },
  { url: "https://maps.app.goo.gl/example", label: "Google Map" },
  { url: "https://example.com/cafe", label: "ホームページ" },
];

export async function verifyStoreLinks(page, { externalIndicator = false, screenshotPath } = {}) {
  for (const { url, label } of storeLinkFixtures) {
    const link = page.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveText(label);
    await expect(link).toHaveAttribute("href", url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link.locator('img[aria-hidden="true"], svg[aria-hidden="true"]')).toHaveCount(
      externalIndicator ? 2 : 1,
    );
    await expect(link.locator('[data-external-indicator="true"]')).toHaveCount(
      externalIndicator ? 1 : 0,
    );
    await expect(link).toHaveCSS("font-size", "11px");
    for (const icon of await link.locator("img, svg").all()) {
      const iconBox = await icon.boundingBox();
      expect(iconBox.width).toBe(16);
      expect(iconBox.height).toBe(16);
    }
    if (label === "Instagram") {
      await expect.poll(() => link.locator("img").evaluate((img) => img.naturalWidth)).toBe(96);
    }
    await expect(link).toHaveCSS("text-decoration-line", "none");
    const appearance = await link.evaluate((el) => {
      const css = getComputedStyle(el);
      return {
        background: css.backgroundColor,
        radius: parseFloat(css.borderRadius),
      };
    });
    expect(appearance.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(appearance.radius).toBeGreaterThanOrEqual(20);
    const box = await link.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    await link.hover();
    await expect(link).not.toHaveCSS("background-color", appearance.background);
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await link.blur();
  }
  await page.mouse.move(0, 0);
  if (screenshotPath) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const lastLink = await page
      .getByRole("link", { name: "ホームページ", exact: true })
      .boundingBox();
    const { width, height } = page.viewportSize();
    await page.screenshot({
      path: screenshotPath,
      clip: {
        x: 0,
        y: 0,
        width,
        height: Math.min(height, Math.ceil(lastLink.y + lastLink.height + 24)),
      },
    });
  }
}
