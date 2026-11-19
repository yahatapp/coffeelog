import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(resolve("apps/brewlog/package.json"));
const { expect } = require("@playwright/test");

export async function verifyRecentRecordsLayout(page, sectionTitle, record) {
  const rating = record.getByRole("img", { name: /^評価 / });
  await expect(rating).toBeVisible();
  const rowBox = await record.boundingBox();
  const ratingBox = await rating.boundingBox();
  expect(ratingBox.y + ratingBox.height / 2).toBeCloseTo(rowBox.y + rowBox.height / 2, 0);

  const title = page.getByRole("heading", { name: sectionTitle, exact: true });
  const header = await title.locator("..").boundingBox();
  const titleBox = await title.boundingBox();
  const action = page.getByRole("link", { name: "すべて見る", exact: true });
  await expect(action).toBeVisible();
  const actionText = await action.evaluate((link) => {
    const range = document.createRange();
    range.selectNodeContents(link);
    return range.getBoundingClientRect().toJSON();
  });
  expect(titleBox.x - header.x).toBeCloseTo(header.x + header.width - actionText.right, 0);
  const actionBox = await action.boundingBox();
  expect(titleBox.y + titleBox.height / 2).toBeCloseTo(actionBox.y + actionBox.height / 2, 0);
  expect(actionBox.height).toBeGreaterThanOrEqual(44);

  const create = page.getByRole("link", { name: /抽出を記録する|新しい一杯を記録する/ });
  const createBox = await create.boundingBox();
  expect(createBox.y + createBox.height).toBeLessThan(titleBox.y);
}
