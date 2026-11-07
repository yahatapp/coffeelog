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
  const verifyDetailLayout = async () => {
    const store = page.getByRole("region", { name: "お店の情報", exact: true });
    const coffee = page.getByRole("region", { name: "飲んだコーヒーの概要", exact: true });
    await expect(
      page.getByRole("heading", { name: "記録の詳細", level: 2, exact: true }),
    ).toBeVisible();
    const storeTitle = store.getByRole("heading", { level: 3 });
    await expect(storeTitle).toHaveText(data.log.cafeName);
    await expect(storeTitle).toHaveCSS("font-size", "24px");
    const storeBox = await store.boundingBox();
    const coffeeBox = await coffee.boundingBox();
    expect(coffeeBox.y).toBeGreaterThan(storeBox.y + storeBox.height);
    await expect(coffee).toHaveCSS("border-top-style", "solid");
    await expect(store.getByRole("img")).toHaveCount(0);
    const coffeeTitle = [data.log.origin, data.log.variety, data.log.process]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(" ");
    const heading = coffee.getByRole("heading", { level: 3 });
    await expect(heading).toHaveAccessibleName(coffeeTitle || "飲んだコーヒー");
    await expect(heading).toHaveCSS("font-size", "18px");
    const flag = heading.locator('[aria-label$="の国旗"]');
    await expect(flag).toHaveCount(data.log.origin === "エチオピア" ? 1 : 0);
    if (data.log.origin === "エチオピア") {
      await expect(flag).toHaveText("🇪🇹");
      expect((await flag.boundingBox()).x).toBeLessThan(
        (await heading.getByText(coffeeTitle, { exact: true }).boundingBox()).x,
      );
    }
    const servingOptions = coffee.getByRole("list", { name: "提供方法", exact: true });
    const beanOptions = coffee.getByRole("list", { name: "豆の種類", exact: true });
    const optionRow = servingOptions.locator("..");
    await expect(optionRow).toHaveCSS("align-items", "baseline");
    const divider = await optionRow.evaluate((row) => {
      const style = getComputedStyle(row, "::before");
      return { column: style.gridColumnStart, width: style.width };
    });
    expect(divider).toEqual({ column: "2", width: "1px" });
    for (const [group, label, options, value] of [
      [
        servingOptions,
        "提供方法",
        ["ホット", "アイス"],
        { hot: "ホット", iced: "アイス" }[data.log.servingStyle],
      ],
      [
        beanOptions,
        "豆の種類",
        ["シングル", "ブレンド"],
        data.log.isBlend == null ? undefined : data.log.isBlend ? "ブレンド" : "シングル",
      ],
    ]) {
      await expect(group.getByRole("listitem")).toHaveText(options);
      await expect(group).toHaveCSS("align-items", "baseline");
      for (const option of await group.getByRole("listitem").all())
        await expect(option).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      const current = group.locator('[aria-current="true"]');
      if (value) {
        await expect(current).toHaveText(value);
        await expect(current).toHaveCSS("font-weight", "700");
        await expect(current).toHaveCSS("font-size", "14px");
      } else {
        await expect(current).toHaveCount(0);
      }
      await expect(group.getByRole("button")).toHaveCount(0);
      await expect(coffee.getByText(label, { exact: true })).toHaveCount(0);
    }
    await expect(coffee.getByText("評価", { exact: true })).toHaveCount(0);
    if (data.log.rating != null) {
      const rating = coffee.getByRole("img", { name: `評価 ${data.log.rating} / 5`, exact: true });
      const ratingBox = await rating.boundingBox();
      const optionsBox = await optionRow.boundingBox();
      expect(ratingBox.y).toBeGreaterThan(optionsBox.y + optionsBox.height);
      expect(ratingBox.width).toBe(coffeeBox.width);
      const stars = rating.locator(':scope > [aria-hidden="true"]');
      await expect(stars.locator("> span")).toHaveCount(5);
      const score = rating.getByText(String(data.log.rating), { exact: true });
      await expect(score).toHaveCSS("font-size", "12px");
      const starBox = await stars.boundingBox();
      const scoreBox = await score.boundingBox();
      expect(scoreBox.y).toBeGreaterThan(starBox.y + starBox.height);
      for (const box of [starBox, scoreBox])
        expect(Math.abs(box.x + box.width / 2 - ratingBox.x - ratingBox.width / 2)).toBeLessThan(1);
    }
    const linkList = store.getByRole("list", { name: "お店のリンク", exact: true });
    await expect(linkList).toHaveCount(data.log.links.length > 0 ? 1 : 0);
    const links = linkList.getByRole("link");
    await expect(links).toHaveCount(data.log.links.length);
    const columns = data.log.links.length >= 4 ? 4 : 3;
    const boxes = [];
    for (const link of await links.all()) {
      await expect(link).toHaveText("");
      const box = await link.boundingBox();
      expect(box.width).toBe(56);
      expect(box.height).toBe(56);
      boxes.push(box);
    }
    const firstRow = boxes.slice(0, columns);
    if (firstRow.length) expect(new Set(firstRow.map((box) => box.y)).size).toBe(1);
    if (boxes.length > columns) expect(boxes[columns].y).toBeGreaterThan(boxes[0].y);
    const gaps = firstRow.slice(1).map((box, i) => box.x - firstRow[i].x - firstRow[i].width);
    if (gaps.length > 1) expect(Math.abs(Math.max(...gaps) - Math.min(...gaps))).toBeLessThan(1);
    const history = store.getByRole("link", { name: "お店の記録", exact: true });
    await expect(history).toHaveAttribute("href", `/stores/${ids.store}`);
    const prefecture = store.getByText(data.log.prefecture || "都道府県未登録", { exact: true });
    const prefectureBox = await prefecture.boundingBox();
    const historyBox = await history.boundingBox();
    expect(historyBox.x).toBeGreaterThan(prefectureBox.x + prefectureBox.width);
    expect(
      Math.abs(historyBox.y + historyBox.height / 2 - prefectureBox.y - prefectureBox.height / 2),
    ).toBeLessThan(1);
    await expect(history.getByText("お店の記録")).toHaveCSS("text-decoration-line", "underline");
    await expect(history).toHaveCSS("font-weight", "400");
    await history.focus();
    await expect(history).toBeFocused();
    await expect(history).toHaveCSS("outline-style", "solid");
    await history.blur();
  };
  const audit = async (name) => {
    if (
      [
        "log-detail",
        "log-detail-long",
        "detail-without-optional",
        "log-detail-four-links",
        "log-detail-many-links",
      ].includes(name)
    )
      await verifyDetailLayout();
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
        externalIndicator: name === "store-detail",
        iconOnly: name === "log-detail",
        screenshotPath: resolve(output, `cafelog-${name}-links-${width}.png`),
      });
    if (name === "stores") {
      const store = page.getByRole("button", { name: /検証用カフェ/ });
      const links = page.getByRole("link", { name: "Instagram", exact: true }).locator("../..");
      await expect(store).toHaveCSS("padding-bottom", "4px");
      await expect(links).toHaveCSS("padding-bottom", "8px");
      await expect(links).toHaveCSS("row-gap", "4px");
    }
    await audit(name);
  }
  const originalLinks = data.log.links;
  data.log.links = [...originalLinks, { id: "fourth-link", url: "https://example.com/cafe/other" }];
  data.log.servingStyle = "iced";
  data.log.isBlend = true;
  await visit(`/logs/${ids.log}`);
  await audit("log-detail-four-links");
  data.log.servingStyle = "hot";
  data.log.isBlend = false;
  data.log.links = Array.from({ length: 10 }, (_, index) => ({
    id: `many-link-${index}`,
    url: `https://example.com/cafe/${index}`,
    type: "website",
  }));
  await visit(`/logs/${ids.log}`);
  await audit("log-detail-many-links");
  data.log.links = originalLinks;
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
  await page.getByRole("link", { name: "お店の記録", exact: true }).click();
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
  data.log.isBlend = null;
  data.log.note = null;
  data.log.origin = null;
  data.log.variety = " ";
  data.log.price = null;
  data.log.links = [];
  await visit(`/logs/${ids.log}`);
  await expect(page.getByText("評価なし", { exact: true })).toBeVisible();
  await expect(page.getByText("メモは登録されていません。", { exact: true })).toBeVisible();
  await audit("detail-without-optional");
  data.log.process = null;
  await visit(`/logs/${ids.log}`);
  await expect(page.getByRole("heading", { name: "飲んだコーヒー", exact: true })).toBeVisible();
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
