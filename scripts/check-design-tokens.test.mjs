import { test } from "node:test";
import assert from "node:assert/strict";
import { declarations, validateTokens, checkRepository } from "./check-design-tokens.mjs";
const contract = { "--cl-text": { type: "color", required: true } };
test("required tokens, reference chains, cycles and types", () => {
  assert.deepEqual(
    validateTokens(contract, new Map(), declarations("--ref: #123456; --cl-text: var(--ref);")),
    [],
  );
  assert.match(validateTokens(contract, new Map(), new Map()).join(), /Undefined/);
  assert.match(
    validateTokens(contract, new Map(), declarations("--cl-text: var(--missing);")).join(),
    /Undefined/,
  );
  assert.match(
    validateTokens(
      contract,
      new Map(),
      declarations("--cl-text: var(--ref); --ref: var(--cl-text);"),
    ).join(),
    /Circular/,
  );
  assert.match(
    validateTokens(contract, new Map(), declarations("--cl-text: 1rem;")).join(),
    /Invalid color/,
  );
});
test("both repository themes meet the public contract", () => assert.ok(checkRepository() > 0));
test("theme text pairs and input boundaries meet contrast requirements", async () => {
  const { readFileSync } = await import("node:fs");
  const root = new URL("../packages/ui/src/styles/", import.meta.url);
  function luminance(hex) {
    const channels = hex
      .slice(1)
      .match(/../g)
      .map((n) => parseInt(n, 16) / 255)
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  function contrast(a, b) {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  for (const theme of ["brewlog", "cafelog"]) {
    const values = declarations(readFileSync(new URL(`themes/${theme}.css`, root), "utf8"));
    const color = (name) => {
      const value = values.get(`--cl-${name}`);
      const ref = value.match(/^var\(([^)]+)\)$/);
      return ref ? values.get(ref[1]) : value;
    };
    for (const [foreground, background] of [
      ["color-text", "color-background"],
      ["color-text-muted", "color-background"],
      ["color-text-muted", "color-surface"],
      ["color-on-action-primary", "color-action-primary"],
      ["color-on-action-primary", "color-action-primary-hover"],
      ["color-on-action-secondary", "color-action-secondary-hover"],
      ["color-on-action-secondary", "color-action-secondary"],
      ["color-success", "color-success-surface"],
      ["color-warning", "color-warning-surface"],
      ["color-error", "color-error-surface"],
    ])
      assert.ok(
        contrast(color(foreground), color(background)) >= 4.5,
        `${theme}: ${foreground}/${background}`,
      );
    assert.ok(
      contrast(color("color-border-input"), color("color-surface")) >= 3,
      `${theme}: input boundary`,
    );
  }
});
