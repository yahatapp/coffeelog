import { describe, expect, it } from "vitest";
import { toBeanCreateInput, toBeanUpdateInput, type BeanFormValues } from "./form-values";

const beanValues = (coffeeType: BeanFormValues["coffeeType"]): BeanFormValues => ({
  name: "  エチオピア  ",
  coffeeType,
  origin: " エチオピア ",
  region: " シダマ ",
  variety: " 74158 ",
  farm: " ベンサ農園 ",
  producer: " アセファ・ドゥカモ ",
  purchaseStore: " ロースタリー ",
  roastLevel: 2,
  roastDate: "2026-09-01",
  purchaseDate: "2026-09-20",
  processMethod: "washed",
  note: " フローラル ",
  version: " 2026.09 ",
  isArchived: false,
});

describe("豆フォームの変換", () => {
  it("スペシャルティコーヒーの生産情報を整形して送信する", () => {
    expect(toBeanCreateInput(beanValues("specialty"), null)).toMatchObject({
      region: "シダマ",
      variety: "74158",
      farm: "ベンサ農園",
      producer: "アセファ・ドゥカモ",
    });
  });

  it("レギュラーコーヒーへ変更したときは非表示の生産情報を消去する", () => {
    expect(toBeanUpdateInput(beanValues("regular"))).toMatchObject({
      region: null,
      variety: null,
      farm: null,
      producer: null,
    });
  });
});
