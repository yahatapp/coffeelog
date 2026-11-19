import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(resolve("apps/brewlog/package.json"));
const { expect } = require("@playwright/test");

export async function verifyReviewNavigation(page, { app, baseURL, output, width, data }) {
  const brew = app === "brewlog";
  const main = page.getByRole("main");
  const recordNav = page.getByRole("navigation").getByRole("link", { name: "記録", exact: true });
  const settings = page.getByRole("navigation").getByRole("link", { name: "設定", exact: true });
  const dialog = page.getByRole("alertdialog", { name: "入力内容を破棄しますか？" });
  const openForm = () =>
    main.getByRole(brew ? "button" : "link", { name: "追加", exact: true }).click();

  await page.goto(baseURL + "/logs/new" + (brew ? `?beanId=${data.bean.id}` : ""));
  if (brew)
    await expect(page.getByRole("combobox", { name: "ドリッパー", exact: true })).toHaveValue(
      data.dripper.id,
    );
  await main.getByRole("button", { name: brew ? "戻る" : "記録一覧に戻る", exact: true }).click();
  await expect(page).toHaveURL(baseURL + "/logs");
  await expect(dialog).toHaveCount(0);

  await openForm();
  const input = page.getByRole(brew ? "textbox" : "combobox", {
    name: brew ? "抽出コメント" : "店舗名",
    exact: true,
  });
  await input.fill("離脱確認の入力");
  await settings.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: resolve(output, `${app}-discard-confirmation-${width}.png`) });
  await dialog.getByRole("button", { name: "入力を続ける" }).click();
  await expect(settings).toBeFocused();
  await expect(input).toHaveValue("離脱確認の入力");

  const beforeUnload = page.waitForEvent("dialog").then(async (prompt) => {
    expect(prompt.type()).toBe("beforeunload");
    await prompt.dismiss();
  });
  await page.evaluate(() => {
    setTimeout(() => window.location.reload(), 0);
  });
  await beforeUnload;
  await expect(input).toHaveValue("離脱確認の入力");

  await page.goBack({ waitUntil: "commit" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "破棄する" }).click();
  await expect(page).toHaveURL(baseURL + "/logs");
  await openForm();
  await expect(input).toHaveValue("");
  await recordNav.click();
  await expect(page).toHaveURL(baseURL + "/logs");

  const id = data.log.id;
  const target = main.locator(`[data-return-card="${id}"]`);
  const iced = main.getByRole("button", { name: /^アイス/ });
  const descending = main.getByRole("button", { name: "評価で降順に並べ替え" });
  const ascending = main.getByRole("button", { name: "評価で昇順に並べ替え" });
  await iced.click();
  await descending.click();
  await expect(ascending).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/temperature=iced&sort=rating$/);
  await target.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(baseURL + "/logs/" + id);
  await expect(main.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page).toHaveTitle(brew ? "抽出記録詳細 | Brewlog" : "記録の詳細 | Cafelog");

  await page.goBack({ waitUntil: "commit" });
  await expect(iced).toHaveAttribute("aria-pressed", "true");
  await expect(ascending).toHaveAttribute("aria-pressed", "true");
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();

  await target.click();
  await main.getByRole("button", { name: brew ? "戻る" : "記録一覧に戻る", exact: true }).click();
  await expect(target).toBeFocused();
  await expect(page).toHaveURL(/temperature=iced&sort=rating$/);
  if (brew) await expect(target.getByText("アイス", { exact: true })).toBeVisible();
  else {
    await expect(main.getByRole("link", { name: "新規追加" })).toHaveCount(0);
    const links = await main
      .locator("[data-return-card]")
      .evaluateAll((cards) => cards.map((card) => card.getAttribute("aria-label")));
    expect(new Set(links).size).toBe(links.length);
    expect(links.some((label) => label.includes("件目"))).toBe(true);
  }

  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const controls = main.getByRole("group", { name: /温度で絞り込む|並び替え/ });
  const clipping = await controls.getByRole("button").evaluateAll((buttons) =>
    buttons.some((button) => {
      const { left, right } = button.getBoundingClientRect();
      const parent = button.parentElement.getBoundingClientRect();
      return (
        left < parent.left ||
        right > parent.right ||
        left < 0 ||
        right > innerWidth ||
        button.scrollWidth > button.clientWidth
      );
    }),
  );
  expect(clipping).toBe(false);
  await page.screenshot({
    path: resolve(output, `${app}-list-text-200-${width}.png`),
    fullPage: true,
  });
  await page.evaluate(() => {
    document.documentElement.style.removeProperty("font-size");
  });

  await main.getByRole("button", { name: /^すべて/ }).click();
  await expect(main.getByText("登録日 2026.10.31（土）", { exact: true }).first()).toBeVisible();

  await page.goto(baseURL + "/stores");
  await main.getByRole("button", { name: "都道府県順" }).click();
  await main.getByRole("button", { name: "店舗を検索", exact: true }).click();
  const search = main.getByRole("searchbox", { name: "店舗を検索", exact: true });
  await search.fill("検証用");
  const store = main.locator(`[data-return-card="${data.store.id}"]`);
  await store.click();
  await main.getByRole("button", { name: "店舗一覧へ戻る", exact: true }).click();
  await expect(store).toBeFocused();
  await expect(search).toHaveValue("検証用");
  await expect(main.getByRole("button", { name: "都道府県順" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page).toHaveURL(baseURL + "/stores?sort=prefecture");
}

export function addReviewLogFixtures(app, data) {
  if (app === "brewlog") data.log.tempType = "ice";
  else data.log.servingStyle = "iced";
  for (let index = 0; index < 10; index++) {
    const id = `99000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
    data.logs.push({
      ...data.log,
      id,
      ...(app === "brewlog"
        ? {
            brewDate: index < 2 ? data.log.brewDate : null,
            tempType: index < 2 ? "ice" : "hot",
            rating: index < 2 ? data.log.rating : (index % 5) + 1,
          }
        : {
            visitDate: index < 2 ? data.log.visitDate : null,
            servingStyle: index < 2 ? "iced" : "hot",
            rating: index < 2 ? data.log.rating : (index % 5) + 1,
            cafeName:
              index < 2 ? data.log.cafeName : "長い店舗名を表示するためのテスト用カフェ".repeat(3),
          }),
    });
  }
}
