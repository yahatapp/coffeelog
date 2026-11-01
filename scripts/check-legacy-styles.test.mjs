import { test } from "node:test";
import assert from "node:assert/strict";
import { legacyStyleIssues, checkLegacyStyles } from "./check-legacy-styles.mjs";
test("legacy style guard rejects definitions, utilities and literal classes", () => {
  for (const code of [
    "@theme { --color-primary: red; }",
    "color: var(--app-color-primary);",
    '<div className="flex gap-4"/>',
    "twMerge(a,b)",
    "<div className={`bg-coffee-primary`}/>",
  ])
    assert.ok(legacyStyleIssues(code).length);
  assert.deepEqual(legacyStyleIssues("<div className={styles.root}/>"), []);
  assert.deepEqual(checkLegacyStyles(), []);
});
