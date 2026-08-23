import { describe, expect, it } from "vitest";
import { getCountryCode } from "./flag";

describe("getCountryCode", () => {
  it("matches Japanese and English origin names case-insensitively", () => {
    expect(getCountryCode("エチオピア イルガチェフェ")).toBe("et");
    expect(getCountryCode("Kenya AA")).toBe("ke");
  });

  it("returns null for empty and unknown origins", () => {
    expect(getCountryCode(null)).toBeNull();
    expect(getCountryCode("Unknown origin")).toBeNull();
  });
});
