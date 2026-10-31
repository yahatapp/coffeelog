# デザインシステム（実装中）

[実装計画](../design-system-implementation-plan.md)と[実施記録](migration-status.md)を確認する。現在のコードは移行途中であり、本番公開前に全対象の検証を完了する。

## 値の管理

`packages/ui/src/styles/tokens/primitives.css`に基本値、`semantic.css`に寸法・文字・モーションの役割を定義する。ブランドの色は`themes/`に置き、htmlの`data-app-theme`で選ぶ。色の役割とブランド基本値は同じ要素に定義する。

公開トークンは`tokens/contract.json`で名前・型・必須条件を管理する。値はCSSだけで管理する。部品は公開トークンを使い、基本値を直接参照しない。

## 検証

リポジトリの指定Node環境で以下を実行する。

```sh
node scripts/check-design-tokens.mjs
node --test scripts/check-design-tokens.test.mjs
pnpm check
pnpm test
pnpm build
```

トークン検証は現在の静的な値と`var(--name)`参照を対象にする。CSS全体の構文、描画結果のコントラスト、クラスの存在を検証する検査は別途必要で、現時点では未接続である。

## CSS Modules

部品のTSXの隣に`.module.css`とクラス宣言を置く。部品は`components` layerを使い、ページは`pages` layerに置く。型宣言とCSSのクラス名は同時に更新する。型宣言と実CSSの一致検査は未実装である。
