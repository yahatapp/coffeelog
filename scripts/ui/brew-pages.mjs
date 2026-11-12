import { storeLinkFixtures, verifyStoreLinks } from "./store-links.mjs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
const require = createRequire(resolve("apps/brewlog/package.json"));
const { expect } = require("@playwright/test");
export async function verifyBrewPages(page, { baseURL, output, width, ids, reset, readMode }) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const records = [];
  const visit = async (path) => {
    await page.goto(baseURL + path);
    await page.getByRole("navigation").waitFor();
    await page.waitForLoadState("networkidle");
  };
  const audit = async (name) => {
    if (name === "log-detail" || name === "log-detail-long" || name === "log-detail-timeline") {
      const metrics = page.getByRole("group", { name: "抽出条件", exact: true }).locator("> div");
      await expect(metrics).toHaveCount(3);
      const boxes = await metrics.evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return { top: box.top, height: box.height };
        }),
      );
      if (
        new Set(boxes.map((box) => box.top)).size !== 1 ||
        new Set(boxes.map((box) => box.height)).size !== 1
      )
        throw new Error("Brew summary metrics must share a top edge and height");
      const timeline = page.getByRole("list", { name: "注水の手順", exact: true });
      if (await timeline.count()) {
        const steps = timeline.getByRole("listitem");
        for (const step of await steps.all()) {
          const marker = step.locator(':scope > [aria-hidden="true"]');
          const markerBox = await marker.boundingBox();
          if (!markerBox || markerBox.width < 20 || markerBox.height < 20)
            throw new Error("Pour timeline marker is missing or too small");
        }
        const connector = await steps.first().evaluate((node) => {
          const style = getComputedStyle(node, "::before");
          return {
            content: style.content,
            width: parseFloat(style.width),
            color: style.backgroundColor,
          };
        });
        if (
          connector.content === "none" ||
          connector.width < 1 ||
          connector.color === "rgba(0, 0, 0, 0)"
        )
          throw new Error("Pour timeline connector is missing");
      }
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    await writeFile(
      resolve(output, `brewlog-${name}-${width}-axe.json`),
      JSON.stringify(result.violations, null, 2),
    );
    if (result.violations.length)
      throw new Error(
        `${name}: ${JSON.stringify(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) })))}`,
      );
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))
      throw new Error(`${name}: horizontal overflow`);
    await page.screenshot({
      path: resolve(output, `brewlog-${name}-${width}.png`),
      fullPage: true,
    });
    records.push(name);
  };

  if (process.env.UI_SMOKE_ONLY === "1") {
    const data = reset();
    const version = {
      ...data.bean,
      id: "00000000-0000-4000-8000-000000000099",
      parentBeanId: ids.bean,
      version: "2026.11.01",
      purchaseDate: "2026-11-01",
      createdAt: "2026-11-01T03:00:00Z",
    };
    data.beans.push(version);
    await visit(`/beans/${ids.bean}`);
    await page.getByRole("link", { name: /2026.11.01.*登録日/ }).click();
    await expect(page).toHaveURL(baseURL + "/beans/" + version.id);
    await audit("bean-version-navigation");
    for (const [name, path] of [
      ["home", "/"],
      ["drippers", "/settings/drippers"],
      ["grinders", "/settings/grinders"],
    ]) {
      await visit(path);
      await audit(name);
    }
    await visit("/settings/drippers");
    await expect(page.getByRole("textbox", { name: "ドリッパー名", exact: true })).toBeVisible();
    readMode("loading");
    await page.goto(baseURL + "/settings");
    await expect(page.getByRole("status")).toBeVisible();
    readMode("all-error");
    await visit("/settings");
    await audit("settings-error");
    readMode("success");
    await page.getByRole("button", { name: "再試行", exact: true }).click();
    await expect(page.getByText("器具一覧を取得できませんでした。")).toHaveCount(0);
    await audit("settings-recovered");
    return records;
  }
  reset().store.links = storeLinkFixtures.map(({ url }) => url);
  for (const [name, path] of [
    ["home", "/"],
    ["beans", "/beans"],
    ["bean-detail", `/beans/${ids.bean}`],
    ["logs", "/logs"],
    ["log-detail", `/logs/${ids.log}`],
    ["stores", "/stores"],
    ["store-detail", `/stores/${ids.store}`],
    ["settings", "/settings"],
    ["drippers", "/settings/drippers"],
    ["grinders", "/settings/grinders"],
    ["not-found", "/missing"],
  ]) {
    await visit(path);
    if (["stores", "store-detail"].includes(name))
      await verifyStoreLinks(page, {
        externalIndicator: name !== "stores",
        screenshotPath: resolve(output, `brewlog-${name}-links-${width}.png`),
      });
    await audit(name);
  }
  await visit(`/beans/${ids.bean}`);
  await page.getByRole("button", { name: "編集", exact: true }).click();
  await expect(page).toHaveURL(baseURL + `/beans/${ids.bean}/edit`);
  await visit(`/beans/${ids.bean}`);
  await page.getByRole("button", { name: "淹れる", exact: true }).click();
  await expect(page).toHaveURL(baseURL + `/logs/new?beanId=${ids.bean}`);
  await visit(`/beans/${ids.bean}`);
  const storeLink = page.getByRole("link", { name: "検証用の店舗", exact: true });
  await storeLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(baseURL + `/stores/${ids.store}`);

  const minimalBean = reset().bean;
  Object.assign(minimalBean, {
    coffeeType: "regular",
    origin: null,
    roastLevel: null,
    purchaseStore: null,
    storeId: null,
    purchaseDate: null,
    roastDate: null,
    processMethod: null,
    note: null,
    version: null,
  });
  await visit(`/beans/${ids.bean}`);
  await expect(page.getByRole("heading", { name: "生産情報", exact: true })).toHaveCount(0);
  await expect(page.getByText("未設定", { exact: true })).toHaveCount(4);
  await expect(page.getByText("メモはありません。", { exact: true })).toBeVisible();
  await audit("bean-detail-without-optional");
  const icedData = reset();
  icedData.log.tempType = "ice";
  await visit("/");
  await expect(page.getByRole("img", { name: "アイス", exact: true })).toBeVisible();
  await expect(page.getByText("アイス", { exact: true })).toHaveCount(0);
  await audit("home-iced");
  const timelineData = reset();
  timelineData.log.pours = [
    { id: "pour-1", pourNumber: 1, waterAmount: 30, duration: 30, pourType: "center_only" },
    { id: "pour-2", pourNumber: 2, waterAmount: 60, duration: 40, pourType: "center_around" },
    { id: "pour-3", pourNumber: 3, waterAmount: 60, duration: 0, pourType: "all" },
  ];
  await visit(`/logs/${ids.log}`);
  await audit("log-detail-timeline");
  await expect(
    page
      .locator("dl > div")
      .filter({ has: page.locator("dt", { hasText: "蒸らし時間" }) })
      .locator("dd"),
  ).toHaveText("30 秒");
  await expect(page.getByRole("list", { name: "注水の手順" }).getByRole("listitem")).toHaveCount(4);
  const beanLink = page.getByRole("link", { name: /検証用コーヒー豆の詳細を見る/ });
  await beanLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(baseURL + "/beans/" + ids.bean);
  await visit(`/logs/${ids.log}`);
  await page.getByRole("link", { name: "編集", exact: true }).click();
  await expect(page).toHaveURL(baseURL + "/logs/" + ids.log + "/edit");
  reset();
  await visit("/beans");
  const beanSort = page.getByRole("group", { name: "並び替え", exact: true });
  const archiveLabel = page.getByText("アーカイブも表示", { exact: true });
  const archiveCheckbox = page.getByRole("checkbox", {
    name: "アーカイブも表示",
    exact: true,
  });
  await expect(beanSort.getByRole("checkbox")).toHaveCount(0);
  await expect(beanSort.getByText("ソート", { exact: true })).toHaveCount(0);
  const beanCard = page.getByRole("link", { name: /検証用コーヒー豆/ });
  const [sortBox, archiveBox, beanBox] = await Promise.all([
    beanSort.boundingBox(),
    archiveLabel.boundingBox(),
    beanCard.locator("xpath=../..").boundingBox(),
  ]);
  if (!sortBox || !archiveBox || !beanBox) throw new Error("Bean list controls are missing");
  expect(archiveBox.y).toBeGreaterThanOrEqual(sortBox.y + sortBox.height);
  expect(archiveBox.y + archiveBox.height).toBeLessThanOrEqual(beanBox.y);
  expect(beanBox.y - (archiveBox.y + archiveBox.height)).toBeLessThanOrEqual(4);
  expect(archiveBox.x + archiveBox.width).toBeCloseTo(sortBox.x + sortBox.width);
  await beanSort.getByRole("button", { name: "豆名で五十音順に並べ替え" }).click();
  await expect(beanSort.getByRole("button", { name: "豆名で降順に並べ替え" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await beanCard.click();
  await expect(page).toHaveURL(new RegExp(`/beans/${ids.bean}$`));
  await page.getByRole("button", { name: "アーカイブする", exact: true }).click();
  await expect(page.getByRole("button", { name: "アーカイブから戻す", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "編集", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "淹れる", exact: true })).toBeDisabled();
  await audit("bean-detail-archived");
  await page.getByRole("link", { name: "バージョン追加", exact: true }).click();
  await expect(page).toHaveURL(baseURL + `/beans/new?parentBeanId=${ids.bean}`);
  await visit("/beans");
  await expect(beanCard).toHaveCount(0);
  await archiveLabel.click();
  await expect(archiveCheckbox).toBeChecked();
  await expect(beanCard).toContainText("アーカイブ済み");
  await audit("beans-with-archived");
  await archiveCheckbox.press("Space");
  await expect(archiveCheckbox).not.toBeChecked();
  await expect(beanCard).toHaveCount(0);
  await visit(`/beans/${ids.bean}`);
  await page.getByRole("button", { name: "アーカイブから戻す", exact: true }).click();
  await visit("/logs");
  await page.getByRole("button", { name: /アイス/ }).click();
  await expect(
    page
      .getByText(/記録はまだありません|表示できる|記録がありません|見つかりません|ログがありません/)
      .first(),
  ).toBeVisible();
  await visit("/stores");
  await page.getByRole("button", { name: /検証用の店舗/ }).click();
  await expect(page).toHaveURL(new RegExp(`/stores/${ids.store}$`));
  await page.getByRole("button", { name: /2026.10.31/ }).click();
  await expect(page).toHaveURL(new RegExp(`/logs/${ids.log}$`));
  for (const [kind, label] of [
    ["drippers", "ドリッパー"],
    ["grinders", "グラインダー"],
  ]) {
    await visit(`/settings/${kind}`);
    const field = page.getByRole("textbox", {
      name: kind === "drippers" ? "ドリッパー名" : "グラインダー名",
      exact: true,
    });
    await field.fill(`追加した${label}`);
    await page
      .getByRole("button", {
        name: kind === "drippers" ? "追加" : "グラインダーを登録",
        exact: true,
      })
      .click();
    const card = page.getByRole("group", { name: `追加した${label}`, exact: true });
    await card.getByRole("button", { name: "デフォルトに設定", exact: true }).click();
    await expect(card.getByRole("button", { name: "デフォルト", exact: true })).toBeVisible();
    await card.getByRole("button", { name: "編集", exact: true }).click();
    await expect(field).toHaveValue(`追加した${label}`);
    await field.fill(`編集した${label}`);
    await page
      .getByRole("button", { name: kind === "drippers" ? "保存" : "変更を保存", exact: true })
      .click();
    await expect(page.getByRole("group", { name: `編集した${label}`, exact: true })).toBeVisible();
    const edited = page.getByRole("group", { name: `編集した${label}`, exact: true });
    page.once("dialog", (dialog) => dialog.accept());
    await edited.getByRole("button", { name: "削除", exact: true }).click();
    await expect(page.getByText(`編集した${label}`, { exact: true })).toHaveCount(0);
  }
  await visit("/settings");
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    page.getByRole("button", { name: /ログアウト/ }).click(),
  ]);
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("fixture.logout")))
    .toBe("called");
  readMode("all-error");
  await page.goto(baseURL + "/beans");
  await expect(page.getByText("豆一覧の取得に失敗しました。")).toBeVisible();
  readMode("success");
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await expect(page.getByRole("link", { name: /検証用コーヒー豆/ })).toBeVisible();

  for (const [name, path] of [
    ["home", "/"],
    ["beans", "/beans"],
    ["bean-detail", `/beans/${ids.bean}`],
    ["logs", "/logs"],
    ["log-detail", `/logs/${ids.log}`],
    ["stores", "/stores"],
    ["store-detail", `/stores/${ids.store}`],
    ["drippers", "/settings/drippers"],
    ["grinders", "/settings/grinders"],
  ]) {
    console.log("brewlog states", name, width);
    readMode("loading");
    await page.goto(baseURL + path);
    await expect(page.getByRole("status").first()).toBeVisible();
    await page.screenshot({
      path: resolve(output, `brewlog-${name}-loading-${width}.png`),
      fullPage: true,
    });
    readMode("all-error");
    await visit(path);
    await expect(page.getByText(/取得.*(?:失敗|できません)/).first()).toBeVisible();
    await audit(name + "-error");
    readMode("success");
    for (
      let retry = 0;
      retry < 3 && (await page.getByText(/取得.*(?:失敗|できません)/).count());
      retry++
    ) {
      const messages = await page.getByText(/取得.*(?:失敗|できません)/).allTextContents();
      const retryButton = page.getByRole("button", { name: /再試行|再読み込み/ }).first();
      await retryButton.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await retryButton.click();
      await expect
        .poll(() => page.getByText(/取得.*(?:失敗|できません)/).allTextContents())
        .not.toEqual(messages);
    }
    await expect(page.getByText(/取得.*(?:失敗|できません)/)).toHaveCount(0);
    await audit(name + "-recovered");
  }
  for (const path of [
    "/",
    "/beans",
    "/logs",
    "/stores",
    "/settings/drippers",
    "/settings/grinders",
  ]) {
    readMode("empty");
    await visit(path);
    await audit(path.replaceAll("/", "-") + "-empty");
  }
  readMode("success");
  const data = reset();
  data.bean.name = "日本語のとても長いコーヒー豆の名前".repeat(6);
  data.bean.note =
    "香りと味についての長い日本語メモ。".repeat(20) + "https://example.com/" + "long".repeat(30);
  data.store.name = "長い日本語の店舗名".repeat(8);
  data.store.links = ["https://example.com/" + "long".repeat(40)];
  data.bean.purchaseStore = data.store.name;
  data.dripper.name = "長い日本語のドリッパー名".repeat(8);
  data.grinder.name = "長い日本語のグラインダー名".repeat(8);
  data.log.brewComment = data.bean.note;
  data.log.note = data.bean.note;
  data.log.pours = [
    { id: "pour-1", pourNumber: 1, waterAmount: 30, duration: 30, pourType: "center_only" },
    { id: "pour-2", pourNumber: 2, waterAmount: 120, duration: 60, pourType: "all" },
  ];
  for (const [name, path] of [
    ["beans", "/beans"],
    ["bean-detail", `/beans/${ids.bean}`],
    ["logs", "/logs"],
    ["log-detail", `/logs/${ids.log}`],
    ["stores", "/stores"],
    ["store-detail", `/stores/${ids.store}`],
    ["drippers", "/settings/drippers"],
    ["grinders", "/settings/grinders"],
  ]) {
    await visit(path);
    await audit(name + "-long");
  }
  reset();
  await visit(`/beans/${ids.bean}`);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page).toHaveURL(baseURL + "/beans");

  return records;
}
