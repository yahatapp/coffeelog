import { describe, expect, it } from "vitest";
import { cafeLogFormSchema, createCafeLogDefaults, toCafeLogPayload } from "./cafeLogForm";
import { FREQUENT_PREFECTURES, PREFECTURES } from "./prefectures";

describe("createCafeLogDefaults", () => {
  it("defaults the serving style to hot", () => {
    expect(createCafeLogDefaults().servingStyle).toBe("hot");
  });

  it("defaults the prefecture to unselected", () => {
    expect(createCafeLogDefaults().prefecture).toBe("");
  });

  it("converts an unselected prefecture to null", () => {
    expect(toCafeLogPayload(createCafeLogDefaults()).prefecture).toBeNull();
  });

  it("accepts a Japanese prefecture and rejects an unknown value", () => {
    expect(
      cafeLogFormSchema.safeParse({
        ...createCafeLogDefaults(),
        cafeName: "テスト店",
        prefecture: "山口県",
      }).success,
    ).toBe(true);
    expect(
      cafeLogFormSchema.safeParse({
        ...createCafeLogDefaults(),
        cafeName: "テスト店",
        prefecture: "不明",
      }).success,
    ).toBe(false);
  });
});

describe("PREFECTURES", () => {
  it("lists the five frequent prefectures first and includes all 47 exactly once", () => {
    expect(PREFECTURES.slice(0, 5)).toEqual(FREQUENT_PREFECTURES);
    expect(PREFECTURES).toHaveLength(47);
    expect(new Set(PREFECTURES)).toHaveLength(47);
  });
});
