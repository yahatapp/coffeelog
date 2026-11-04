import { storeLinkFixtures, verifyStoreLinks } from "./store-links.mjs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
const require = createRequire(resolve("apps/cafelog/package.json"));
const { expect } = require("@playwright/test");
export async function verifyCafePages(
  page,
  { baseURL, output, width, ids, reset, readMode, hold, release, count },
) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const records = [];
  const visit = async (path) => {
    await page.goto(baseURL + path);
    await page.getByRole("navigation").waitFor();
    await page.waitForLoadState("networkidle");
  };
  const closeNotices = async () => {
    const closes = page.locator('[aria-label="通知を閉じる"]').filter({ visible: true });
    for (let i = 0; i < 10 && (await closes.count()); i++) {
      const n = await closes.count();
      await closes.first().focus();
      await page.keyboard.press("Enter");
      await expect.poll(() => closes.count()).toBeLessThan(n);
    }
  };
  const audit = async (name) => {
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    await writeFile(
      resolve(output, `cafelog-${name}-${width}-axe.json`),
      JSON.stringify(r.violations, null, 2),
    );
    if (r.violations.length)
      throw new Error(
        name +
          ": " +
          JSON.stringify(
            r.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
            })),
          ),
      );
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error(name + " overflow");
    await page.screenshot({
      path: resolve(output, `cafelog-${name}-${width}.png`),
      fullPage: true,
    });
    records.push(name);
  };
  let data = reset();
  data.store.links = storeLinkFixtures.map(({ url }) => url);
  data.log.links = storeLinkFixtures.map(({ url }, index) => ({ id: `link-${index}`, url }));
  for (const [name, path] of [
    ["home", "/"],
    ["logs", "/logs"],
    ["log-detail", `/logs/${ids.log}`],
    ["stores", "/stores"],
    ["store-detail", `/stores/${ids.store}`],
    ["settings", "/settings"],
    ["not-found", "/missing"],
  ]) {
    await visit(path);
    if (["log-detail", "stores", "store-detail"].includes(name))
      await verifyStoreLinks(page, {
        externalIndicator: name !== "stores",
        screenshotPath: resolve(output, `cafelog-${name}-links-${width}.png`),
      });
    await audit(name);
  }
  data.logs.push({
    ...data.log,
    id: "10000000-0000-4000-8000-000000000099",
    cafeName: "アイスを飲んだカフェ",
    servingStyle: "iced",
    prefecture: "大阪府",
    rating: null,
    visitDate: "2026-10-30",
  });
  await visit("/logs");
  await page.getByRole("button", { name: /アイス/ }).click();
  await expect(page.getByRole("link", { name: /アイスを飲んだカフェ/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /検証用カフェ/ })).toHaveCount(0);
  await page.getByRole("button", { name: /すべて/ }).click();
  await page.getByRole("button", { name: "都道府県で昇順に並べ替え", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "都道府県で降順に並べ替え", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: /検証用カフェ/ }).click();
  await expect(page).toHaveURL(baseURL + "/logs/" + ids.log);
  await page.getByRole("link", { name: "このお店のコーヒー記録", exact: true }).click();
  await expect(page).toHaveURL(baseURL + "/stores/" + ids.store);
  await page.getByRole("button", { name: /2026.10.31/ }).click();
  await expect(
    page.getByRole("dialog", { name: "飲んだコーヒーの詳細", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "記録ページを開く", exact: true }).click();
  await expect(page).toHaveURL(baseURL + "/logs/" + ids.log);
  await page.getByRole("button", { name: "編集", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "店舗名", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  await expect(page.getByRole("button", { name: "編集", exact: true })).toBeFocused();
  await visit("/settings");
  await expect(
    page.getByRole("heading", { name: "確認用ユーザー", exact: true }).locator("../../.."),
  ).toHaveCSS("padding-top", "24px");
  await expect(
    page.getByRole("heading", { name: "アプリ情報", exact: true }).locator(".."),
  ).toHaveCSS("padding-top", "24px");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
  await page.getByRole("button", { name: "ユーザーIDをコピー", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("fixture-user");
  await expect(page.getByRole("status")).toHaveText("ユーザーIDをコピーしました。");
  await page.getByRole("button", { name: "ログアウト / 再ログイン", exact: true }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__uiLoginCount)).toBe(1);
  for (const [name, path] of [
    ["home", "/"],
    ["logs", "/logs"],
    ["log-detail", `/logs/${ids.log}`],
    ["stores", "/stores"],
    ["store-detail", `/stores/${ids.store}`],
  ]) {
    console.log("cafelog states", name, width);
    readMode("loading");
    await page.goto(baseURL + path);
    await expect(page.getByRole("status").first()).toBeVisible();
    await page.screenshot({
      path: resolve(output, `cafelog-${name}-loading-${width}.png`),
      fullPage: true,
    });
    readMode("all-error");
    await visit(path);
    await expect(page.getByText(/取得.*できません/).first()).toBeVisible();
    await audit(name + "-error");
    readMode("success");
    await page.getByRole("button", { name: "再試行", exact: true }).first().click();
    await expect(page.getByText(/取得.*できません/)).toHaveCount(0);
    await page.waitForLoadState("networkidle");
  }
  for (const [name, path] of [
    ["home", "/"],
    ["logs", "/logs"],
    ["stores", "/stores"],
  ]) {
    readMode("empty");
    await visit(path);
    await audit(name + "-empty");
  }
  readMode("success");
  data = reset();
  data.log.cafeName = "とても長い日本語の店舗の名前".repeat(8);
  data.store.name = data.log.cafeName;
  data.log.note =
    "香りや味、お店の雰囲気を記録した長い日本語のメモ。".repeat(20) +
    "https://example.com/" +
    "long".repeat(40);
  data.log.origin = "長い産地の名前".repeat(10);
  data.log.variety = "非常に長い品種の名前".repeat(8);
  data.log.flavorNotes = ["とても長いフレーバーノート".repeat(10)];
  data.store.links = ["https://example.com/" + "long".repeat(50)];
  data.log.links = [{ id: "long-link", url: data.store.links[0], type: "website" }];
  for (const [name, path] of [
    ["home", "/"],
    ["logs", "/logs"],
    ["log-detail", `/logs/${ids.log}`],
    ["stores", "/stores"],
    ["store-detail", `/stores/${ids.store}`],
  ]) {
    await visit(path);
    await audit(name + "-long");
  }
  data = reset();
  data.log.rating = null;
  data.log.servingStyle = null;
  data.log.note = null;
  data.log.origin = null;
  data.log.price = null;
  data.log.links = [];
  await visit(`/logs/${ids.log}`);
  await expect(page.getByText("評価なし", { exact: true })).toBeVisible();
  await expect(page.getByText("メモは登録されていません。", { exact: true })).toBeVisible();
  await audit("detail-without-optional");
  reset();
  await visit(`/logs/${ids.log}`);
  const deletion = page.getByRole("button", { name: "削除", exact: true });
  await deletion.click();
  await expect(
    page.getByRole("heading", { name: "記録を削除しますか？", exact: true }),
  ).toBeFocused();
  await audit("delete-confirmation");
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  await expect(deletion).toBeFocused();
  await deletion.click();
  hold();
  const before = count();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page.getByRole("button", { name: "削除中...", exact: true })).toBeDisabled();
  await expect.poll(count).toBe(before + 1);
  await release(500);
  await expect(deletion).toBeVisible();
  await closeNotices();
  await deletion.click();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page).toHaveURL(baseURL + "/logs");
  await expect(page.getByText("まだ記録がありません", { exact: true })).toBeVisible();
  return records;
}
