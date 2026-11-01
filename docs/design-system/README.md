# UI開発ガイド

BrewlogとCafelogのUIを実装する人とAI向けのガイドである。標準CSS変数、CSS Modules、共通UIを使う。

1. 色や寸法は公開トークンを参照する。
2. 入力・操作・状態表示は共通UIから選ぶ。
3. 部品の見た目を変える場合は、型・ガイド・両テーマの検証を同時に更新する。
4. 完了前にCSS・型・画面の検査を実行する。

初回はこの文書と[tokens](tokens.md)を読む。実装時は[部品](components.md)と[画面パターン](patterns.md)、レビュー時は[アクセシビリティ](accessibility.md)と[例外](exceptions.md)を参照する。

## 定義と使い方の管理先

| 内容                       | 管理先                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 値                         | [基本値](../../packages/ui/src/styles/tokens/primitives.css)、[用途別の値](../../packages/ui/src/styles/tokens/semantic.css)、[両テーマ](../../packages/ui/src/styles/themes/) |
| 公開する名前・型・必須条件 | [contract.json](../../packages/ui/src/styles/tokens/contract.json)                                                                                                             |
| 部品のAPIと状態            | [公開API](../../packages/ui/src/index.ts)、各部品の型とCSS Modules                                                                                                             |
| 使い分けと判断基準         | このガイド一式                                                                                                                                                                 |
| 実例                       | [実行できる部品一覧](../../scripts/ui/catalog.tsx)、両アプリの利用箇所                                                                                                         |
| 変更と検証                 | [changelog](changelog.md)、[実施記録](migration-status.md)                                                                                                                     |

## 開発用の部品一覧

[Nix開発環境](../../README.md#development)で、リポジトリのルートから実行する。

```sh
pnpm ui:dev
```

- Brewlog：[部品一覧](http://127.0.0.1:5271/__catalog)
- Cafelog：[部品一覧](http://127.0.0.1:5272/__catalog)
- 両ページは初期HTMLのテーマを使う。Portalにも同じ値が継承される。
- 部品一覧は開発専用で、本番のルートやエントリーに含めない。

## 変更後の確認

```sh
pnpm css:types
pnpm check
pnpm test
pnpm build
pnpm --filter brewlog browser:install
pnpm test:ui
```

- `css:types`はCSS Modulesの型宣言を更新する。CIは宣言の古さを検出し、自動で書き換えない。
- `check`はCSS・トークン・クラス参照・旧トークン・Tailwindクラス・ガイド・部品一覧の型と、各パッケージの検査を実行する。
- `test:ui`は認証とAPIをテスト用応答へ置き換え、両アプリを320/390pxで検証する。本番データは使わない。
- CIのデザイン検査は、Turborepoの変更対象判定とは別に毎回実行する。

## 画面比較と失敗の調査

- `test-results/ui/comparison.html`で基準と現在の画像を並べ、重ねて比較する。画像の差にはOSやフォントの違いも含まれる。
- 機能・アクセシビリティ検査の失敗は終了コードで通知する。失敗時はJSON、画面、Playwrightのトレースを保存する。
- トレースは`pnpm --filter brewlog exec playwright show-trace <trace.zipのパス>`で開く。
- CIでは`design-system-ui`成果物をダウンロードし、ディレクトリ構造を保って比較HTMLを開く。
- 基準画像の更新は[更新手順](accessibility.md)に従う。

## 用語と相談先

| 用語         | このプロジェクトでの意味                             |
| ------------ | ---------------------------------------------------- |
| 公開トークン | 部品とページが参照してよいCSS変数                    |
| CSS Modules  | ファイルごとにクラス名を分け、importして使う方式     |
| contract     | トークンの公開名・型・必須条件を定義したファイル     |
| layer        | reset・tokens・base・components・pagesの適用順序     |
| fixture      | 本番の認証やデータを使わず状態を再現するテスト用応答 |

判断に迷う変更は、このリポジトリのPRで両アプリへの影響と案を示し、メンテナーに確認する。採用方針は[改善計画](../design-system-assessment.md)、移行の確認項目は[実装計画](../design-system-implementation-plan.md)を参照する。

更新日：2026年11月1日。
