# トークンとテーマ

## 値を変える場所

- 基本値は[primitives.css](../../packages/ui/src/styles/tokens/primitives.css)に置く。部品から直接参照しない。
- 共通の用途別の値は[semantic.css](../../packages/ui/src/styles/tokens/semantic.css)に置く。
- ブランドの配色は[brewlog.css](../../packages/ui/src/styles/themes/brewlog.css)と[cafelog.css](../../packages/ui/src/styles/themes/cafelog.css)に置く。ブランドの基本値と、それを使う公開名を同じ要素に定義する。
- 公開名・型・必須条件は[contract.json](../../packages/ui/src/styles/tokens/contract.json)に記す。値はCSSだけで管理する。

## 色の役割

[Material Design 3の色の役割](https://m3.material.io/styles/color/the-color-system/)に沿って、面とその上の文字・アイコンの色を組み合わせる。

| 役割 | 用途 |
| --- | --- |
| Surface | 両アプリのページ背景。白いカードや入力欄などの面には Surface Container Lowest を使う。 |
| Primary Container / On Primary Container | 記録一覧から記録を追加するボタンの背景と文字・アイコン。 |
| Tertiary / On Tertiary | 差し色と、その色で塗った面に載せる文字・アイコン。 |
| Tertiary Container / On Tertiary Container | 器具の「デフォルト」ラベルや写真追加のような、個別に目を留めてほしい要素の背景と文字・アイコン。 |
| Outline / Outline Variant | 入力などの境界には Outline、カードの枠や区切り線には Outline Variant を使う。 |

## 公開名の追加

1. 既存の公開名で意味が合うものを探す。
2. 不足する用途を`--cl-`で始まる名前にする。
3. contractに型と必須条件を追加し、共通CSSか両テーマに値を定義する。
4. 色は前景・背景・操作状態を組で確認する。
5. 利用箇所、[変更記録](changelog.md)、検証を更新する。

名前と型の一覧はcontractを参照する。この文書に値や一覧を複製しない。部品内だけの一時変数は`--_`で始め、同じCSS Module内で定義する。

## CSSの入口

- 両アプリは`main.tsx`の最初に`index.css`をimportする。
- `index.css`から`@yahatapp/ui/styles.css`と自分のテーマを一度だけ読み込む。
- htmlの`data-app-theme`は、[Brewlog](../../apps/brewlog/index.html)と[Cafelog](../../apps/cafelog/index.html)で初期値を指定する。
- layerの順序とreset・baseの取り込みは[共通入口](../../packages/ui/src/styles/index.css)が定義する。

## CSS Modulesでの利用

部品は`components`、ページは`pages` layerを使う。以下はページの例である。

```css
@layer pages {
  .root {
    padding: var(--cl-space-page-inline);
    color: var(--cl-color-text);
    background: var(--cl-color-surface);
  }
}
```

- クラスはデフォルトimportし、`styles.root`のようにドット形式で参照する。
- JSXで固定の色や寸法をstyleに渡さない。データから計算する位置などは[例外](exceptions.md)に従う。
- 要素名だけのセレクターと`:global`を部品に書かない。
- 共通部品の内部DOMや背景・内部余白をページから上書きしない。外側の配置はラッパーで扱う。

## 検査

- `pnpm check:design`は、両テーマの欠落・参照切れ・循環・型の不適合、基本値への直接参照を検出する。
- 値の検査は、現在使う静的な値と`var(--name)`参照を対象にする。新しいCSS構文を値に使う場合は、検証器と失敗検出テストも更新する。
- 新しい単位や色表現を、検査だけ無効にして導入しない。
