import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import stylelint from "stylelint";
const lint = (code) =>
  stylelint.lint({
    code,
    codeFilename: "packages/ui/src/components/fixture.module.css",
    configFile: resolve("stylelint.config.mjs"),
  });
test("Stylelint rejects invalid syntax and unknown properties", async () => {
  assert.ok((await lint("@layer components { .root { colr: red; } }")).errored);
  assert.ok((await lint(".root {")).errored);
  assert.equal(
    (await lint("@layer components { .root { color: var(--cl-color-text); } }")).errored,
    false,
  );
});
