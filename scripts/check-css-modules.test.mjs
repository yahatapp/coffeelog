import { test } from "node:test";
import assert from "node:assert/strict";
import { moduleIssues, checkModules, classReferenceIssues } from "./check-css-modules.mjs";
test("module rules reject global selectors, wrong layers, raw values and private references", () => {
  assert.deepEqual(
    moduleIssues(
      "@layer components { .root { color: var(--cl-color-text); margin: 0; } }",
      "components",
    ).errors,
    [],
  );
  for (const css of [
    ".root { color: red; }",
    "@layer pages { .root { margin: 1rem; } }",
    "@layer components { button { color: #123456; } }",
    "@layer components { .root { color: var(--cl-ref-brand-primary); } }",
    "@layer components { .root { color: var(--cl-no-such-token); } }",
  ])
    assert.ok(moduleIssues(css, "components").errors.length, css);
});
test("current modules and class declarations agree", () => assert.deepEqual(checkModules(), []));

test("missing CSS class references fail independently of handwritten types", () => {
  const modules = new Map([["/tmp/sample.module.css", new Set(["root"])]]);
  assert.deepEqual(
    classReferenceIssues('import styles from "./sample.module.css"; styles.root;', "/tmp", modules),
    [],
  );
  assert.match(
    classReferenceIssues(
      'import styles from "./sample.module.css"; styles.missing;',
      "/tmp",
      modules,
    ).join(),
    /Missing class/,
  );
});
