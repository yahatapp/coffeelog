import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve("apps/brewlog/package.json"));
const { expect } = require("@playwright/test");
export async function verifyBrewForms(
  page,
  { baseURL, output, width, ids, hold, count, release, readMode },
) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const audit = async (name) => {
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))
      throw new Error("Form overflows viewport");
    for (const button of await page
      .getByRole("button", { name: /注ぎ回数を|評価上げる|評価下げる/ })
      .all()) {
      const box = await button.boundingBox();
      if (!box || box.width < 44 || box.height < 44) throw new Error("Counter target below 44px");
    }
    const result = await new AxeBuilder({ page })
      .include("form")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    if (result.violations.length)
      throw new Error(
        `${name}: ${JSON.stringify(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
      );
    await page.screenshot({
      path: resolve(output, `brewlog-${name}-${width}.png`),
      fullPage: true,
    });
  };
  const save = async ({ success, path, preserve }) => {
    const before = count();
    hold();
    await page
      .getByRole("button", { name: /保存/ })
      .last()
      .click();
    await expect.poll(count).toBe(before + 1);
    await expect(page.getByRole("button", { name: /保存中/ })).toBeDisabled();
    await page.keyboard.press("Enter");
    await expect.poll(count).toBe(before + 1);
    await release(success ? 200 : 500);
    if (success) await expect(page).toHaveURL(new RegExp(path + "$"));
    else {
      await expect(page.getByRole("button", { name: /保存する/ }).last()).toBeEnabled();
      if (preserve) await preserve();
    }
  };
  await page.goto(baseURL + "/beans/new");
  await page.getByRole("textbox", { name: "豆の名前", exact: true }).fill("検証用の新しい豆");
  await page.locator("label").filter({ hasText: "スペシャルティコーヒー" }).click();
  await page.getByRole("combobox", { name: "購入店 (任意)", exact: true }).selectOption("new");
  await page.getByRole("textbox", { name: "店舗名", exact: true }).fill("新しい検証店");
  await page
    .getByRole("textbox", { name: "お店のリンク 1", exact: true })
    .fill("https://example.com/store");
  const roast = page.getByRole("slider", { name: "焙煎度", exact: true });
  await roast.focus();
  await page.keyboard.press("ArrowRight");
  await expect(roast).toHaveAttribute("aria-valuenow", "4");
  await audit("bean-create");
  await save({
    success: false,
    preserve: () =>
      expect(page.getByRole("textbox", { name: "豆の名前", exact: true })).toHaveValue(
        "検証用の新しい豆",
      ),
  });
  await save({ success: true, path: "/beans" });
  await expect(
    page.getByRole("region", { name: "操作結果の通知" }).getByText("豆を登録しました。"),
  ).toBeVisible();
  await page.goto(baseURL + `/beans/${ids.bean}/edit`);
  const beanName = page.getByRole("textbox", { name: "豆の名前", exact: true });
  await expect(beanName).toHaveValue("検証用コーヒー豆");
  await beanName.fill("編集後の豆");
  await audit("bean-edit");
  await save({ success: false, preserve: () => expect(beanName).toHaveValue("編集後の豆") });
  await save({ success: true, path: "/beans" });
  await expect(
    page.getByRole("region", { name: "操作結果の通知" }).getByText("豆を更新しました。"),
  ).toBeVisible();
  await page.goto(baseURL + `/beans/new?parentBeanId=${ids.bean}`);
  await expect(page.getByRole("textbox", { name: "豆の名前", exact: true })).toBeDisabled();
  await page.getByLabel("購入日", { exact: true }).fill("2026-11-01");
  await expect(page.getByRole("textbox", { name: "バージョン名", exact: true })).toHaveValue(
    "2026.11.01",
  );
  await save({ success: true, path: "/beans" });
  await page.goto(baseURL + `/logs/new?beanId=${ids.bean}`);
  await expect(page.getByRole("combobox", { name: "コーヒー豆", exact: true })).toHaveValue(
    ids.bean,
  );
  await expect(page.getByRole("combobox", { name: "ドリッパー", exact: true })).toHaveValue(
    ids.dripper,
  );
  const grind = page.getByRole("slider", { name: /挽き目/ });
  await grind.focus();
  await page.keyboard.press("ArrowRight");
  await expect(grind).toHaveAttribute("aria-valuenow", "11");
  const alignment = await page.locator("[data-slider-mark]").evaluateAll((nodes) =>
    nodes.map((el) => {
      const label = document.querySelector(`[data-slider-label="${el.dataset.sliderMark}"]`);
      const a = el.getBoundingClientRect(),
        b = label.getBoundingClientRect();
      return Math.abs(a.left + a.width / 2 - (b.left + b.width / 2));
    }),
  );
  if (alignment.some((delta) => delta > 1.5))
    throw new Error("Slider marks and labels are misaligned");
  const track = await page.locator("[data-slider-track]").boundingBox();
  await page.mouse.click(track.x + track.width * 0.75, track.y + track.height / 2);
  await expect
    .poll(async () => Number(await grind.getAttribute("aria-valuenow")))
    .toBeGreaterThan(11);
  const labels = await page.locator("[data-slider-label]").evaluateAll((nodes) =>
    nodes
      .filter((el) => getComputedStyle(el).visibility !== "hidden")
      .map((el) => ({
        left: el.getBoundingClientRect().left,
        right: el.getBoundingClientRect().right,
      })),
  );
  for (let i = 1; i < labels.length; i++)
    if (labels[i].left < labels[i - 1].right) throw new Error("Slider labels overlap");
  await page.getByRole("button", { name: /アイス/ }).click();
  await page.getByRole("spinbutton", { name: /氷の量/ }).fill("100");
  await page.getByRole("spinbutton", { name: "注ぎ回数 (投)", exact: true }).fill("2");
  await page.getByRole("combobox", { name: "注水量 (ml)", exact: true }).first().selectOption("50");
  await page.getByRole("combobox", { name: "時間 (秒)", exact: true }).first().selectOption("30");
  await page
    .getByRole("combobox", { name: "注ぎ方", exact: true })
    .first()
    .selectOption("center_only");
  await page.getByRole("button", { name: "評価上げる", exact: true }).click();
  await page
    .getByRole("textbox", { name: "抽出コメント", exact: true })
    .fill("試験した抽出コメント");
  await audit("log-create");
  await save({
    success: false,
    preserve: () =>
      expect(page.getByRole("textbox", { name: "抽出コメント", exact: true })).toHaveValue(
        "試験した抽出コメント",
      ),
  });
  await save({ success: true, path: "/logs" });
  await expect(
    page.getByRole("region", { name: "操作結果の通知" }).getByText("抽出記録を保存しました。"),
  ).toBeVisible();
  await page.goto(baseURL + `/logs/${ids.log}/edit`);
  await page
    .getByRole("textbox", { name: "テイスティングノート", exact: true })
    .fill("編集したノート");
  await expect(page.getByText(/未保存の変更があります/)).toBeVisible();
  await audit("log-edit");
  await save({
    success: false,
    preserve: () =>
      expect(page.getByRole("textbox", { name: "テイスティングノート", exact: true })).toHaveValue(
        "編集したノート",
      ),
  });
  await save({ success: true, path: `/logs/${ids.log}` });
  await expect(page.getByText("編集したノート")).toBeVisible();
  readMode("error");
  await page.goto(baseURL + `/logs/${ids.log}/edit`);
  await expect(page.getByText("編集データの取得に失敗しました。")).toBeVisible();
  readMode("success");
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "テイスティングノート", exact: true }),
  ).toHaveValue("編集したノート");
}
