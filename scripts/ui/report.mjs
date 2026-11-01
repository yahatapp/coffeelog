import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, relative, join } from "node:path";
import { createHash } from "node:crypto";
const output = resolve(process.env.UI_OUTPUT || "test-results/ui");
mkdirSync(output, { recursive: true });
const reference = resolve(
  process.env.UI_REFERENCE ||
    (existsSync("docs/design-system/evidence/reference")
      ? "docs/design-system/evidence/reference"
      : "docs/design-system/evidence/t11"),
);
const files = (dir) => (existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith(".png")) : []);
const names = [...new Set([...files(reference), ...files(output)])].sort();
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const source = (dir, name) => escape(relative(output, join(dir, name)).replaceAll("\\", "/"));
const info = (dir, name) => {
  const path = join(dir, name);
  if (!existsSync(path)) return null;
  const b = readFileSync(path);
  return {
    hash: createHash("sha256").update(b).digest("hex"),
    width: b.readUInt32BE(16),
    height: b.readUInt32BE(20),
  };
};
const rows = names.map((name) => {
  const before = info(reference, name),
    after = info(output, name);
  return {
    name,
    before,
    after,
    status: !after ? "未取得" : !before ? "新規" : before.hash === after.hash ? "一致" : "変更あり",
  };
});
const body = rows
  .map(
    (row) =>
      `<section><h2>${escape(row.name)} — ${row.status}</h2><p>基準 ${row.before ? `${row.before.width}×${row.before.height}` : "なし"} / 現在 ${row.after ? `${row.after.width}×${row.after.height}` : "なし"}</p><div class="pair">${row.before ? `<figure><figcaption>基準</figcaption><img loading="lazy" src="${source(reference, row.name)}" alt="基準 ${escape(row.name)}"></figure>` : ""}${row.after ? `<figure><figcaption>現在</figcaption><img loading="lazy" src="${source(output, row.name)}" alt="現在 ${escape(row.name)}"></figure>` : ""}</div>${row.before && row.after ? `<details><summary>重ねて比較</summary><label>現在の画像の表示範囲 <input type="range" min="0" max="100" value="50" oninput="this.closest('details').querySelector('.current').style.clipPath='inset(0 '+(100-this.value)+'% 0 0)'"></label><div class="overlay"><img loading="lazy" src="${source(reference, row.name)}" alt="基準"><img loading="lazy" class="current" src="${source(output, row.name)}" alt="現在"></div></details>` : ""}</section>`,
  )
  .join("\n");
const counts = Object.fromEntries(
  ["一致", "変更あり", "新規", "未取得"].map((status) => [
    status,
    rows.filter((row) => row.status === status).length,
  ]),
);
writeFileSync(
  join(output, "comparison.json"),
  JSON.stringify({ reference: relative(process.cwd(), reference), counts, cases: rows }, null, 2) +
    "\n",
);
writeFileSync(
  join(output, "comparison.html"),
  `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>UI画面比較</title><style>body{font:16px system-ui;margin:24px;color:#172018;background:#fafafa}h1{font-size:24px}h2{font-size:18px;overflow-wrap:anywhere}section{margin-block:32px;padding:16px;background:white;border:1px solid #ccc}figure{margin:0;min-width:0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pair img{max-width:100%;height:auto}label{display:block;margin-block:12px}.overlay{position:relative;width:min(390px,100%)}.overlay img{display:block;width:100%;height:auto}.overlay .current{position:absolute;left:0;top:0;clip-path:inset(0 50% 0 0)}summary{cursor:pointer;padding:12px}input{min-height:44px;vertical-align:middle}</style><h1>UI画面比較</h1><p>${escape(JSON.stringify(counts))}</p><p>画像の差を目視で確認します。OSやフォントの違いも差に含まれます。機能・CSS・アクセシビリティ検査の失敗はfailure.jsonとtrace.zipを確認してください。</p>${body}</html>`,
);
console.log(`UI comparison: ${relative(process.cwd(), join(output, "comparison.html"))}`);
