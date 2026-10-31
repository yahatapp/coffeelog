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

## 検証環境の使い方

変更前の画面は`node scripts/ui/prepare-baseline.mjs`で旧コードを展開し、`node scripts/ui/inventory.mjs`と`node scripts/ui/baseline.mjs`で記録する。基準はコミット5054e9eで固定する。

指定のNix環境で`pnpm check:design`、`pnpm test:design`、`pnpm test:ui`を実行する。部品一覧はUI検証サーバーの`/__catalog`で確認する。サーバー内でだけ認証SDKを置き換え、実APIへの要求はPlaywrightで応答する。アプリの本番エントリーは検証用SDKや部品一覧を読み込まない。

APIの空状態が既定。`UI_SCENARIO=error`で取得失敗、`loading`で取得待機、`save-error`で更新失敗を再現する。認証はURLに`uiAuth=loading`または`uiAuth=error`を指定する。個別画面のデータはbaseline.mjsのAPI応答へ追加する。日時・画像・入力データを固定し、スクリーンショットは入場アニメーション後に取得する。

部品一覧では両アプリを別ページで表示し、それぞれhtmlのテーマを継承する。結果とaxeの指摘は`evidence/verification/`へ保存する。現段階の検証コマンドは移行前の部品の指摘も記録し、T04以降で対象部品の指摘を解消する。

CSS Modulesはデフォルトimportとドット形式のクラス参照を使う。CSSのクラス集合と型宣言の一致を検査し、存在しない参照を検出する。Stylelintでは全CSSの構文と規約を検査する。旧Tailwindのディレクティブ・変数名を許可する設定はT11で削除する。
