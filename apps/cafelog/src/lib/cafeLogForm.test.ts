import { describe, expect, it } from "vitest";
import {
  cafeLogFormSchema,
  createCafeLogDefaults,
  parseFlavorNotes,
  toCafeLogPayload,
} from "./cafeLogForm";
import { FREQUENT_PREFECTURES, PREFECTURES } from "./prefectures";
import { classifyCafeLink } from "./cafeLinks";

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

  it("trims the producer name and converts an empty value to null", () => {
    expect(
      toCafeLogPayload({ ...createCafeLogDefaults(), producer: "  ホセ・ヒラルド  " }).producer,
    ).toBe("ホセ・ヒラルド");
    expect(toCafeLogPayload(createCafeLogDefaults()).producer).toBeNull();
  });

  it("trims flavor notes, drops blank entries and serializes them for the API", () => {
    expect(
      toCafeLogPayload({
        ...createCafeLogDefaults(),
        flavorNotes: ["  ベリー  ", "", "  ", " ジャスミン "],
      }).flavorNote,
    ).toBe("ベリー、ジャスミン");
    expect(toCafeLogPayload(createCafeLogDefaults()).flavorNote).toBeNull();
    expect(toCafeLogPayload({ ...createCafeLogDefaults(), flavorNotes: [] }).flavorNote).toBeNull();
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

describe("classifyCafeLink", () => {
  it.each([
    ["https://www.instagram.com/example/", "instagram"],
    ["https://maps.app.goo.gl/example", "google_maps"],
    ["https://www.google.com/maps/place/example", "google_maps"],
    ["https://example.com/shop", "website"],
  ] as const)("classifies %s as %s", (url, type) => {
    expect(classifyCafeLink(url)).toBe(type);
  });
});

describe("PREFECTURES", () => {
  it("lists the five frequent prefectures first and includes all 47 exactly once", () => {
    expect(PREFECTURES.slice(0, 5)).toEqual(FREQUENT_PREFECTURES);
    expect(PREFECTURES).toHaveLength(47);
    expect(new Set(PREFECTURES)).toHaveLength(47);
  });
});

describe("parseFlavorNotes", () => {
  it.each([null, undefined, "", " 、,， "])("provides an empty input for %s", (value) => {
    expect(parseFlavorNotes(value)).toEqual([""]);
  });

  it("splits existing notes separated by Japanese and Western commas", () => {
    expect(parseFlavorNotes(" ベリー、 ジャスミン,チョコレート，ピーチ ")).toEqual([
      "ベリー",
      "ジャスミン",
      "チョコレート",
      "ピーチ",
    ]);
  });

  it("preserves flavor notes when a saved record is edited again", () => {
    const values = { ...createCafeLogDefaults(), flavorNotes: ["ベリー", "ジャスミン"] };
    expect(parseFlavorNotes(toCafeLogPayload(values).flavorNote)).toEqual(values.flavorNotes);
  });
});
