import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve("apps/brewlog/package.json"));
const { expect } = require("@playwright/test");

export async function verifyNotices(page, { app, width, output }) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  for (const [variant, title] of [
    ["success", "完了しました"],
    ["warning", "確認してください"],
    ["error", "エラーが発生しました"],
  ]) {
    const message = "確認用の長い日本語の操作結果です。".repeat(4);
    await page.evaluate((notice) => globalThis.__uiNotify(notice), { variant, message });
    const region = page.getByRole("region", { name: "操作結果の通知" });
    // High-priority notices use a separate live region until focused. Closed notices can remain mounted.
    const heading = region.locator("h2").filter({ hasText: title, visible: true });
    const body = region.getByText(message, { exact: true }).filter({ visible: true });
    const close = region.locator('[aria-label="通知を閉じる"]').filter({ visible: true });
    await expect(heading).toBeVisible();
    await expect(body).toBeVisible();
    await close.focus();
    await expect(region.getByRole("button", { name: "通知を閉じる", exact: true })).toBeVisible();
    const h = await heading.boundingBox(),
      b = await body.boundingBox(),
      c = await close.boundingBox();
    expect(b.y).toBeGreaterThanOrEqual(Math.max(h.y + h.height, c.y + c.height));
    expect(c.y).toBeLessThan(h.y + h.height);
    expect(c.y + c.height).toBeGreaterThan(h.y);
    expect(c.width).toBeGreaterThanOrEqual(44);
    expect(c.height).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(width);
    if (variant === "success") {
      await expect(heading).toHaveCSS("color", "rgb(22, 101, 52)");
      await expect(heading.locator("xpath=../../..")).toHaveCSS(
        "background-color",
        "rgb(240, 253, 244)",
      );
    }
    const audit = await new AxeBuilder({ page })
      .include('[aria-label="操作結果の通知"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    const name =
      variant === "warning" ? `${app}-notice-${width}` : `${app}-notice-${variant}-${width}`;
    await page.screenshot({ path: resolve(output, `${name}.png`) });
    await page.keyboard.press("Enter");
    await expect(body).toBeHidden();
  }
}
