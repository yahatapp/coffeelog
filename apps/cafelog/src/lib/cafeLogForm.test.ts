import { describe, expect, it } from "vitest";
import { createCafeLogDefaults } from "./cafeLogForm";

describe("createCafeLogDefaults", () => {
  it("defaults the serving style to hot", () => {
    expect(createCafeLogDefaults().servingStyle).toBe("hot");
  });
});
