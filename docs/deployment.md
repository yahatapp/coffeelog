# 本番デプロイの確認と復旧

本番デプロイを担当する人向けの手順。認証エラーが出た場合は「トークンの更新」、公開後の確認には「再実行」を参照する。

1. `Deploy Brewlog` と `Deploy Cafelog` の失敗したステップを確認する。
2. 認証エラーなら、対象 Environment の `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を確認する。
3. 復旧後は両ワークフローの成功と、公開された Worker のバージョンを確認する。

## 2026年11月3日の調査

main の `b2c2862` では、両アプリともビルド・テスト・依存監査・DB マイグレーションが成功し、Wrangler の公開処理が失敗した。

| 実行 | 失敗内容 |
| --- | --- |
| [Brewlog](https://github.com/yahatapp/coffeelog/actions/runs/41530653935) | Worker 取得時に認証エラー `10000`、続くアカウント取得時に `Invalid access token` (`9109`) |
| [Cafelog](https://github.com/yahatapp/coffeelog/actions/runs/41530654041) | Worker 取得時にレート制限 `10429` |

前の main (`5ce520f`) でも、[Cafelog は認証エラー](https://github.com/yahatapp/coffeelog/actions/runs/41459597538)、[Brewlog はレート制限](https://github.com/yahatapp/coffeelog/actions/runs/41459597663)で失敗している。ログから、トークンの期限切れ・失効・権限不足のどれかまでは確定できない。

## DB 更新前のアクセス確認

- 両 CD は `scripts/check-cloudflare-deploy.mjs` で、対象アカウントの既存 Worker 設定を取得してから DB マイグレーションに進む。
- HTTP 429 と 5xx は最大3回試す。待機は30秒、60秒を基本とし、`Retry-After` が長ければその指定に従う。待機が120秒を超える場合は終了する。
- 認証エラーでは再試行せず終了する。ログには HTTP ステータスと数値のエラーコードだけを出し、トークンや API の応答本文は出さない。
- この確認で分かるのは Worker 設定の読み取り権限まで。公開の書き込み権限や R2 など、すべてのデプロイ権限は確認できない。

## トークンの更新

CI はローカルの `wrangler login` を使わず、各 GitHub Environment の Secret で認証する。[Cloudflare の CI 認証手順](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)も参照する。

1. Cloudflare でデプロイ用 API トークンの状態・期限・対象アカウント・権限を確認する。必要なら再発行する。
2. 対象 Worker の公開に必要な権限を確認する。[Workers の権限](https://developers.cloudflare.com/workers/authorization/workers/#wrangler)に加え、Cafelog の `CAFELOG_IMAGES` は R2 を使うため、binding に必要な権限も確認する。
3. GitHub の [production-brewlog](https://github.com/yahatapp/coffeelog/settings/environments) と [production-cafelog](https://github.com/yahatapp/coffeelog/settings/environments) で、それぞれ `CLOUDFLARE_API_TOKEN` を更新する。`CLOUDFLARE_ACCOUNT_ID` がトークンの対象アカウントと一致することも確認する。

- トークンの値は Secret の入力欄に直接設定する。リポジトリ、PR、チャット、ログには書かない。
- 既存のローカル OAuth ログインや接続ツールが使えても、GitHub Environment のトークンが有効であることの確認にはならない。
- 更新権限がない場合は、リポジトリと Cloudflare アカウントの管理者に依頼する。

## 再実行

1. Actions の `Deploy Brewlog` と `Deploy Cafelog` を main で実行する。Secret だけを更新した場合は、両ワークフローの `Run workflow` から起動できる。
2. アクセス確認、DB マイグレーション、Wrangler 公開がすべて成功したことを確認する。
3. Cloudflare で新バージョンの公開とトラフィック100%を確認する。アプリの初期表示と操作も確認する。

- レート制限が続く場合は API 利用量と制限の解除を確認してから再実行する。
- 公開済みバージョンを戻す必要がある場合は、[公開と復旧の記録](design-system/release-verification.md#公開方法と戻し先)を参照する。DB は Worker のロールバックでは戻らない。

| 用語 | 意味 |
| --- | --- |
| Environment | 本番アプリごとの GitHub Actions 設定。CD で使う Secret を保持する |
| Secret | API トークンや接続情報を保存する GitHub の機密設定 |

最終更新日: 2026年11月3日
