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
  storeId: "",
  storeName: "",
  storePrefecture: "",
  storeLinks: [""],
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
      storeId: null,
      store: null,
    });
  });

  it("店舗なしのスペシャルティ、既存店舗の選択、新しい店舗の登録を変換する", () => {
    expect(toBeanCreateInput(beanValues("specialty"), null)).toMatchObject({
      storeId: null,
      store: null,
    });
    const storeId = "00000000-0000-4000-8000-000000000001";
    expect(toBeanCreateInput({ ...beanValues("specialty"), storeId }, null)).toMatchObject({
      storeId,
      store: null,
    });
    expect(
      toBeanCreateInput(
        {
          ...beanValues("specialty"),
          storeId: "new",
          storeName: " 店舗 ",
          storePrefecture: "東京都",
          storeLinks: [" https://example.com ", ""],
        },
        null,
      ),
    ).toMatchObject({
      storeId: null,
      purchaseStore: null,
      store: { name: "店舗", prefecture: "東京都", links: ["https://example.com"] },
    });
  });

  it("店舗登録を選んだときだけ店舗名・URLを検証する", () => {
    expect(() => toBeanCreateInput({ ...beanValues("specialty"), storeId: "new" }, null)).toThrow();
    expect(() =>
      toBeanCreateInput(
        {
          ...beanValues("specialty"),
          storeId: "new",
          storeName: "店舗",
          storeLinks: ["javascript:alert(1)"],
        },
        null,
      ),
    ).toThrow();
    expect(() =>
      toBeanCreateInput({ ...beanValues("regular"), storeId: "new" }, null),
    ).not.toThrow();
  });
});
