# 一括移行の最終確認と復旧手順

## 公開前の確認

2026年11月1日に、T01〜T12の完了後、以下を確認した。公開後の結果は末尾に記録した。

- [ガイドだけを更新したCI](https://github.com/yahatapp/coffeelog/actions/runs/41265576965)でも、型・テスト・build、デザイン検査、UI操作、依存監査が成功した。ローカルでも固定ロックファイルのインストールとbuildが成功した。
- 元の82対象ファイルすべてに、[移行後の結果](evidence/inventory-final.json)がある。全ルートと作成・編集・削除、取得・保存失敗、画像操作はT07〜T12の検証記録に対応する。
- 両テーマそれぞれ33件の配色・操作状態を確認した。通常文字の確認対象は最小5.59:1、フォーカスと周囲の面は最小6.00:1だった。無効部品は透明度0.6の合成結果を記録し、操作不能であることと区別した。背景を45%の黒で覆う場合の合成値も記録した。Dialogの本文は不透明な面に表示する。[配色・拡大・状態の結果](evidence/t13/quality.json)を参照。
- キーボード操作、ラベル・エラー・無効状態のアクセシビリティツリーを確認した。部品一覧は390px幅で文字を200%にし、横はみ出しと文字の切れがない。productionのフォームも320px幅・200%で、固定ナビに隠れず保存できた。reduced-motionと上下のセーフエリアはT05・T06以降の検証を含めて確認した。
- productionのHTML・CSS・JSをローカル配信し、両アプリの初期画面、テーマ、作成、保存後の通知、設定への移動、axe指摘なしを確認した。[結果](evidence/t13/production-local.json)を参照。認証とAPIはブラウザー内のテスト応答であり、本番データを書き換える検証ではない。
- 公開トークン87件の契約、CSS Modulesの宣言、旧トークン・Tailwindのクラスと依存・仮の公開口の削除を検査した。API、DB定義・マイグレーション、Workerのbinding設定に今回の変更はない。

LINE内ブラウザーとスクリーンリーダーの実機確認は、依頼者の指定により対象外とした。

## CSSサイズと画面の差

移行前の`5054e9e`を一時ディレクトリへ展開し、当時の固定ロックファイルを使ってビルドした。現在の依存やソースへ旧パッケージを混ぜていない。gzipは比較の両側を同じPython実装・圧縮レベル9で計測した。

| アプリ | 移行前CSS | 移行後CSS | 移行前gzip | 移行後gzip |
| --- | ---: | ---: | ---: | ---: |
| Brewlog | 59,966 bytes | 40,703 bytes | 10,285 bytes | 7,098 bytes |
| Cafelog | 49,281 bytes | 46,202 bytes | 8,859 bytes | 7,319 bytes |

[実測値](evidence/t13/build-comparison.json)。共通トークン、reset・base、部品・ページのCSSが成果物に含まれ、layerの順序が保たれる。不要なTailwindの生成CSSがなくなった一方、Field・Dialog・画像操作や各状態のCSSを明示した。

画面では、補助文字と入力境界を濃くし、secondaryの文字と面を一組にした。主要操作を44px以上にし、Dialogの余白、画像操作の配置、ナビとセーフエリアの余白を揃えた。日付の日本語表記、fixtureの記録あり／なし、検証時のセーフエリアの有無も画像差に含まれる。これらを表示崩れと区別し、[変更前](evidence/before/)と[新しい基準画像198枚](evidence/reference/)を確認した。画像の一致だけで操作やアクセシビリティの合否を決めない。

## 公開方法と戻し先

[PR #139](https://github.com/yahatapp/coffeelog/pull/139)を、必須のVerify成功と未解決レビューなしを確認してmainへマージした。公開コミットは`ee2a536c02ca76051a263debf7021aafe550fd38`。既存のDeploy Brewlog・Deploy Cafelogワークフローで、それぞれ検証・build・既存マイグレーションの適用・Worker公開が成功した。両アプリの全移行をまとめて公開済みである。

公開前にCloudflare APIで以下を取得し、両バージョンが現在も再公開可能であることを確認した。

| アプリ | 公開前のバージョン | 公開前のdeployment |
| --- | --- | --- |
| Brewlog | `91529c44-6f75-44d2-803f-e31246a361ca` | `999b5d6b-825a-4910-9fee-eb6773358060` |
| Cafelog | `7d12074d-272b-49b0-ae0c-4f4c0f523fd7` | `bd048589-d03e-4971-b1c7-636e4a4edb53` |

一方の公開に失敗した場合は、失敗したジョブと現在のdeploymentを確認する。再実行で解消しない場合、公開済みのアプリも含めて上のバージョンへ戻し、両アプリで初期表示と操作を再確認する。認証済みのNix環境で、必要なアプリのコマンドを実行する。

```sh
pnpm --filter brewlog exec wrangler rollback 91529c44-6f75-44d2-803f-e31246a361ca
pnpm --filter cafelog exec wrangler rollback 7d12074d-272b-49b0-ae0c-4f4c0f523fd7
```

Wranglerのロールバックは指定バージョンの新しいdeploymentを作る。DBや外部リソースは戻さない。今回それらの定義変更はない。[Cloudflareの復旧手順](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)に従い、バージョンとトラフィック100%を確認する。問題がない状態での本番ロールバックは実行していない。

## 公開後の確認

2026年11月1日に以下を確認し、実装計画の全86項目を完了した。

| アプリ | 公開ジョブ | 新バージョン（100%） |
| --- | --- | --- |
| [Brewlog](https://brewlog.ky12228121.workers.dev) | [成功](https://github.com/yahatapp/coffeelog/actions/runs/41267759515) | `6edd06b6-ef65-4a16-9c2a-86ff093420bf` |
| [Cafelog](https://cafelog.ky12228121.workers.dev) | [成功](https://github.com/yahatapp/coffeelog/actions/runs/41267759473) | `1e93d7ca-d799-480b-b7a7-a0cd96cbd70c` |

- Cloudflare APIと公開ログで、両バージョンの公開とトラフィック100%を確認した。公開失敗とロールバックは発生していない。
- 本番URLのHTML・CSS・JSが200で取得でき、初期HTMLのテーマが正しい。公開CSSのSHA-256は、両アプリともローカルで検証した成果物と一致した。
- 公開済みファイルで初期画面、320px幅・200%拡大のフォーム保存、通常文字サイズの保存完了通知、設定への移動を確認した。テーマ色と横はみ出しなし、axe指摘0件・ブラウザー例外0件も確認した。[公開後の結果とファイルのハッシュ](evidence/t13/published.json)、同ディレクトリのpublished画像を参照。
- この操作検証は、配信されたJSのSDK初期化部分だけをブラウザー内でテスト実装に置き換え、全API要求へテスト応答を返して行った。本番のLINEログインやサーバーへのレコード作成を実施した結果ではない。公開済みUIの処理と見た目の確認範囲を示す。
