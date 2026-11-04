import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve("apps/cafelog/package.json"));
const { expect } = require("@playwright/test");

export const storeLinkFixtures = [
  { url: "https://www.instagram.com/example/", label: "Instagram" },
  { url: "https://maps.app.goo.gl/example", label: "Google Map" },
  { url: "https://example.com/cafe", label: "ホームページ" },
];

export async function verifyStoreLinks(page) {
  for (const { url, label } of storeLinkFixtures) {
    const link = page.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveText(label);
    await expect(link).toHaveAttribute("href", url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link.locator('img[aria-hidden="true"], svg[aria-hidden="true"]')).toHaveCount(1);
    if (label === "Instagram") {
      await expect.poll(() => link.locator("img").evaluate((img) => img.naturalWidth)).toBe(96);
    }
    const box = await link.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
  }
}
