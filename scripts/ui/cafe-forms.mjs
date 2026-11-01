import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
const require = createRequire(resolve("apps/cafelog/package.json"));
const { expect } = require("@playwright/test");
export async function verifyCafeControlHeights(page) {
  const processBox = await page
    .getByRole("combobox", { name: "精製方法", exact: true })
    .boundingBox();
  const roastBox = await page.getByRole("textbox", { name: "焙煎度", exact: true }).boundingBox();
  expect(processBox.height).toBe(roastBox.height);
  expect(processBox.y).toBe(roastBox.y);
}
export async function verifyCafeForms(
  page,
  { baseURL, output, width, ids, reset, hold, mode, count, release, releaseUpload, readMode },
) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const records = [];
  const visit = async (path) => {
    await page.goto(baseURL + path);
    await page.getByRole("navigation").waitFor();
  };
  const audit = async (name) => {
    await verifyCafeControlHeights(page);
    const result = await new AxeBuilder({ page })
      .include("form")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    await writeFile(
      resolve(output, `cafelog-${name}-${width}-axe.json`),
      JSON.stringify(result.violations, null, 2),
    );
    if (result.violations.length)
      throw new Error(
        JSON.stringify(
          result.violations.map((v) => ({
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
  const submit = async (label) => {
    const button = page.getByRole("button", { name: label, exact: true });
    await button.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const b = await button.boundingBox(),
      n = await page.getByRole("navigation").boundingBox();
    if (b.y + b.height > n.y) throw new Error("Save obscured");
    await button.click();
  };
  const preview = async (name) => {
    const trigger = page.getByRole("button", { name, exact: true });
    await trigger.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: /プレビュー/ });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect
        .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
        .toBe(true);
    }
    const result = await new AxeBuilder({ page })
      .include("[data-image-preview]")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    if (result.violations.length)
      throw new Error("Image dialog " + JSON.stringify(result.violations));
    await page.screenshot({ path: resolve(output, `cafelog-image-dialog-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole("button", { name: "プレビューを閉じる", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  };
  const closeNotices = async () => {
    const close = page.locator('[aria-label="通知を閉じる"]').filter({ visible: true });
    for (let i = 0; i < 10 && (await close.count()); i++) {
      const count = await close.count();
      await close.first().focus();
      await page.keyboard.press("Enter");
      await expect.poll(() => close.count()).toBeLessThan(count);
    }
  };
  const data = reset();
  await visit("/logs/new");
  await audit("create-empty");
  await page.getByRole("combobox", { name: "店舗名", exact: true }).fill(" ");
  await submit("この内容で保存する");
  await expect(page.getByText("店舗名は必須項目です。", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "店舗名", exact: true }).fill(data.store.name);
  await expect(page.getByRole("combobox", { name: "都道府県", exact: true })).toHaveValue("東京都");
  await expect(page.getByRole("textbox", { name: "お店のリンク 1", exact: true })).toHaveValue(
    "https://example.com/cafe",
  );
  await page
    .getByRole("textbox", { name: "お店のリンク 1", exact: true })
    .fill("ftp://example.com/cafe");
  await submit("この内容で保存する");
  await expect(page.getByRole("textbox", { name: "お店のリンク 1", exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await audit("invalid-link");
  await page
    .getByRole("textbox", { name: "お店のリンク 1", exact: true })
    .fill("https://example.com/cafe");
  await page.getByRole("button", { name: "リンクを追加", exact: true }).click();
  await page
    .getByRole("textbox", { name: "お店のリンク 2", exact: true })
    .fill("https://example.com/" + "long".repeat(50));
  await page.getByRole("button", { name: "リンク 2 を削除", exact: true }).click();
  await page
    .getByRole("radiogroup", { name: "豆の種類" })
    .locator("label")
    .filter({ hasText: "ブレンド" })
    .click();
  await page.getByRole("textbox", { name: "原産国", exact: true }).fill("エチオピア");
  await page.getByRole("combobox", { name: "精製方法", exact: true }).selectOption("その他");
  await page
    .getByRole("textbox", { name: "その他の精製方法", exact: true })
    .fill("独自の発酵・精製方法");
  await page.getByRole("button", { name: "フレーバーを追加", exact: true }).click();
  await page.getByRole("textbox", { name: "フレーバーノート 2", exact: true }).fill("ベリー");
  await page.getByRole("button", { name: "フレーバーノート 1を削除", exact: true }).click();
  await page
    .getByRole("radiogroup", { name: "提供温度" })
    .getByRole("radio", { name: "アイス", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "評価を上げる", exact: true }).click();
  await expect(page.getByLabel("評価", { exact: true })).toHaveText("3.5 / 5.0");
  await page.getByRole("spinbutton", { name: "金額 (円)", exact: true }).fill("780");
  await page
    .getByRole("textbox", { name: "メモ / 味の感想", exact: true })
    .fill("長い日本語の味と香りのメモ。".repeat(20));
  const png = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 480;
      const x = c.getContext("2d");
      x.fillStyle = "#73503b";
      x.fillRect(0, 0, 640, 480);
      x.fillStyle = "#f5eadd";
      x.fillRect(100, 80, 440, 320);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  data.setPhoto(png);
  await page.getByLabel("写真を選択", { exact: true }).setInputFiles(
    Array.from({ length: 6 }, (_, i) => ({
      name: `coffee-${i}.png`,
      mimeType: "image/png",
      buffer: png,
    })),
  );
  await expect(
    page
      .getByRole("region", { name: "操作結果の通知" })
      .locator("h2")
      .filter({ hasText: "写真は1つの記録につき5枚までです。" })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByAltText(/選択した写真/)).toHaveCount(5);
  await preview("選択した写真 1 を拡大表示");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "写真 1 を削除", exact: true }).click();
  await audit("create-with-image");
  hold();
  const before = count();
  await submit("この内容で保存する");
  await expect(page.getByRole("button", { name: "保存中...", exact: true })).toBeDisabled();
  await expect.poll(count).toBe(before + 1);
  await release(500);
  await expect(page.getByRole("button", { name: "この内容で保存する", exact: true })).toBeEnabled();
  await expect(page.getByRole("textbox", { name: "その他の精製方法", exact: true })).toHaveValue(
    "独自の発酵・精製方法",
  );
  await expect(page.getByAltText(/選択した写真/)).toHaveCount(1);
  await audit("create-save-error");
  mode("upload-hold");
  await submit("この内容で保存する");
  await expect.poll(() => data.writes.length).toBe(1);
  await expect(page.getByRole("button", { name: "保存中...", exact: true })).toBeDisabled();
  await expect.poll(count).toBe(before + 3);
  await releaseUpload(200);
  await expect(page).toHaveURL(new RegExp("/logs/[^/]+$"));
  await expect.poll(() => data.uploads).toBe(1);
  await page.locator("summary").click();
  await preview("記録の写真 1 を拡大表示");
  await closeNotices();
  await page.getByRole("button", { name: "編集", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "店舗名", exact: true })).toHaveValue(
    data.store.name,
  );
  await page.getByRole("combobox", { name: "店舗名", exact: true }).fill("編集した店舗名");
  hold();
  await submit("保存する");
  await expect(page.getByRole("button", { name: "保存中...", exact: true })).toBeDisabled();
  await release(500);
  await expect(page.getByRole("combobox", { name: "店舗名", exact: true })).toHaveValue(
    "編集した店舗名",
  );
  await audit("edit-save-error");
  await submit("保存する");
  await expect(page.getByRole("heading", { name: "編集した店舗名", exact: true })).toBeVisible();
  await closeNotices();
  await page.getByRole("button", { name: "編集", exact: true }).click();
  await page
    .getByLabel("写真を選択", { exact: true })
    .setInputFiles({ name: "retry.png", mimeType: "image/png", buffer: png });
  mode("upload-error");
  await submit("保存する");
  await expect(
    page
      .getByRole("region", { name: "操作結果の通知" })
      .locator("h2")
      .filter({ hasText: "記録は保存済みです" })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await closeNotices();
  await page.getByRole("button", { name: "編集", exact: true }).click();
  mode("success");
  await page
    .getByLabel("写真を選択", { exact: true })
    .setInputFiles({ name: "retry.png", mimeType: "image/png", buffer: png });
  await submit("保存する");
  await expect.poll(() => data.uploads).toBe(2);
  readMode("images-error");
  await visit(`/logs/${ids.log}`);
  await expect(page.getByText("写真を取得できませんでした。", { exact: true })).toBeVisible();
  readMode("success");
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await expect(page.getByText("写真を取得できませんでした。", { exact: true })).toHaveCount(0);
  return records;
}
