# Brewlog

A lightweight coffee brewing log application for personal/couple use, running as a LINE LIFF App.

## 🚀 技術スタック

- **Frontend:** React (Vite)
- **Backend:** Hono (Cloudflare Workers)
- **Database:** Supabase + Drizzle ORM
- **UI Framework:** shadcn/ui + Tailwind CSS
- **Authentication:** LINE LIFF ID Token Verification

## 🛠 開発準備

このプロジェクトでは、開発環境の管理に **Nix + direnv** を推奨しています。

1.  **リポジトリをクローン**
2.  **環境変数の設定**
    `.env.example` を参考に、以下のファイルを作成してください。
    - `.env.development`: フロントエンド用 (VITE_LIFF_ID等)
    - `.dev.vars`: バックエンド用 (DATABASE_URL, LINE_CHANNEL_ID等)
    - `.env`: データベース・マイグレーション用 (DATABASE_URL)
3.  **セットアップ**

    ```bash
    direnv allow  # Nix環境の有効化
    pnpm install  # lockfileで固定されたVite+もインストール
    pnpm run hooks:install
    ```

## 💻 ローカル開発・デバッグ

LIFFアプリとしてローカルで動作確認を行うには、バックエンド、フロントエンド、およびトンネル（ngrok等）の起動が必要です。

### 1. バックエンド (API) の起動

Cloudflare Workersをローカルで起動します。

```bash
wrangler dev
```

デフォルトでは `http://localhost:8787` で起動します。

### 2. フロントエンドの起動

Viteデバッグサーバを起動します。

```bash
pnpm run dev
```

デフォルトでは `http://localhost:5173` で起動します。
`vite.config.ts` の設定により、`/api` へのリクエストはバックエンド (`localhost:8787`) にプロキシされます。

### 3. トンネルの起動 (ngrok)

LIFFはインターネットからアクセス可能なHTTPSエンドポイントを必要とするため、ngrok等でポート `5173` を公開します。

```bash
ngrok http 5173
```

起動後、発行されたURL（例: `https://xxxx.ngrok-free.dev`）をコピーします。

> [!IMPORTANT]
> `.env.development` の `VITE_ALLOWED_HOSTS` に、使用するngrokのホスト名（例: `xxxx.ngrok-free.dev`）を追加してください。複数のホストがある場合はカンマ区切りで指定できます。

### 4. LIFFの設定

[LINE Developers Console](https://developers.line.biz/console/) にログインし、該当するLIFFアプリの「エンドポイントURL」を、ngrokで発行されたURLに更新します。

これで、LINEアプリ内からローカルの開発環境にアクセスしてデバッグが可能になります。

## 🗄 データベース管理

Drizzle ORMを使用してスキーマを管理しています。

- **マイグレーションファイルの生成:** `pnpm run db:generate`
- **マイグレーションの適用:** `pnpm run db:migrate`

## 📦 その他のコマンド

- `vp check`: 構文チェック、フォーマット、型チェックを一括実行
- `vp check --fix`: 自動修正
- `pnpm run guard:secrets`: 現在の作業ツリー全体の秘密情報スキャン
- `pnpm run guard:secrets:ci -- <base> <head>`: 指定したコミット範囲の秘密情報スキャン
- `pnpm run guard:changes`: 秘密情報、lint・型、テストをまとめて検証
- `vp build`: 本番用ビルド
- `pnpm run deploy`: 本番環境（Cloudflare Workers）へのデプロイ

### pre-commitとAIエージェントのガード

Lefthookのpre-commitでは、ステージ済みの内容だけを対象に、Betterleaks、Vite+、
`git diff --check`、512 KBを超えるファイルの拒否を実行します。BetterleaksはNix dev shellに
含まれます。Codex Cloudでも`.codex/setup.sh`が同じ`flake.nix`を評価し、Node.js、pnpm、
Betterleaksなどをローカル・CIと同じNix環境から利用します。セットアップ時にはPlaywrightの
ChromiumとLinux依存パッケージも導入し、ヘッドレス起動を確認します。Chromiumだけを手動で
再導入する場合は`pnpm run browser:install`、Linux依存パッケージも含める場合は
`pnpm run browser:install:with-deps`を実行してください。

クラウド上のAIエージェントはコミットを作らず差分だけを返す場合があるため、Git hookだけに
依存しません。`.agents/hooks.json`のStop hookでは現在の作業ツリーを検査します。PRのCIでは
baseからheadまでの全コミットを検査するため、PR内で追加後に削除された秘密も検出しますが、
既存履歴全体は走査しません。
ガードを個別に確認する場合は次を実行してください。

```bash
pnpm run guard:betterleaks-canary
pnpm run guard:secrets
pnpm run guard:changes
```

## 🔄 CI/CD (GitHub Actions)

Pull Requestでは`.github/workflows/ci.yml`がNix dev shell内でチェック、テスト、ビルド、
本番依存関係のセキュリティ監査を実行します。`main`へマージされると
`.github/workflows/deploy.yml`が同じ環境でリリースを再検証し、Cloudflare Workersへ
デプロイします。Vite+はルートのdevDependencyとlockfileで`v0.2.7`に固定されています。

ローカルでCI相当の検証を行う場合は、次を実行してください。

```bash
nix develop --command pnpm install --frozen-lockfile
nix develop --command pnpm run guard:betterleaks-canary
nix develop --command pnpm run guard:secrets:ci -- <base-sha> <head-sha>
nix develop --command pnpm run check
nix develop --command pnpm test
nix develop --command pnpm run build
nix develop --command pnpm audit --prod --audit-level moderate
```

### GitHub EnvironmentとCloudflareの設定

1. GitHubの **Settings → Environments** で`production`を作成します。
2. `production`のEnvironment secretsへ次を登録します。
   - `CLOUDFLARE_API_TOKEN`: 下記の最小権限で作成したAPI token
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
   - `DATABASE_URL`: マイグレーション対象となる本番Supabase PostgreSQLの接続URL
3. **Settings → Secrets and variables → Actions → Variables**へ`VITE_LIFF_ID`を登録します。
   `VITE_`変数はブラウザ向けbundleへ埋め込まれるため、秘密情報は設定しないでください。
4. Workerの実行時secretは初回デプロイ前にローカルから登録します。GitHub Actionsが
   マイグレーションに使用するEnvironment secretとWorkerの実行時secretは別管理のため、
   `DATABASE_URL`は同じ値を両方へ登録してください。その他の実行時secretはGitHubへ
   渡す必要はありません。

```bash
pnpm exec wrangler secret put DATABASE_URL
pnpm exec wrangler secret put LINE_CHANNEL_ID
pnpm exec wrangler secret put ALLOWED_LINE_USER_IDS
```

#### Cloudflare Account API tokenの最小権限

個人プロフィールに紐づくGlobal API KeyやUser API tokenではなく、デプロイ先アカウントが
所有する**Account API token**を使用します。Cloudflare Dashboardでデプロイ先アカウントを
選択し、**Manage Account → Account API Tokens → Create Token**から作成してください。

| 設定        | 値                                            |
| ----------- | --------------------------------------------- |
| Token name  | `brewlog-github-actions-deploy`など任意の名前 |
| Permissions | **Account → Workers Scripts → Edit**          |

このリポジトリの`wrangler.jsonc`はWorkers RoutesやKV、R2、D1を使用していないため、
現在の`wrangler deploy`にZone権限や各ストレージ製品の権限は不要です。Account API tokenは
作成元アカウントに紐づきます。`Workers Scripts:Edit`はそのアカウント内のWorkerに対する
権限であり、特定のWorker名だけには限定できません。

作成したtokenを`production` Environmentの`CLOUDFLARE_API_TOKEN`へ、そのアカウントIDを
`CLOUDFLARE_ACCOUNT_ID`へ登録します。token自体は表示時に一度だけコピーし、リポジトリや
ログへ保存しないでください。登録後は、ローカルで環境変数を設定して次のコマンドを実行すると、
Wranglerが`Account API Token`として認識していることを確認できます。

```bash
pnpm exec wrangler whoami
```

Account API tokenは個人ユーザーの所属状態に依存しないため、CI/CDのような機械アクセスに
適しています。Global API Key、Cloudflareメールアドレス、`CLOUDFLARE_API_KEY`はGitHubへ
登録しません。

将来、独自ドメインのrouteをworkflowから変更する場合はZoneの`Workers Routes:Edit`を、
KV、R2、D1などをworkflowから操作する場合は対象サービスの権限をその時点で追加してください。
DBマイグレーションはCDに含めていないため、Supabaseの認証情報もこのtokenには不要です。

### `main`のbranch protection

workflowファイルだけでは、失敗したCIを無視したマージを防止できません。GitHubの
**Settings → Rules → Rulesets**で`main`を対象とするrulesetを作成し、次を設定してください。

1. Pull Requestを必須にします。
2. required status checksを有効化し、`CI / Verify`を必須にします。
3. マージ前にbranchが最新であることと、conversationの解決を必須にします。
4. force pushとbranch削除を禁止します。

branch protectionはGitHubリポジトリ管理者権限が必要なサーバー側設定のため、
リポジトリ内のファイル追加だけでは有効になりません。

### デプロイとDBマイグレーション

デプロイは`main`へのpush時、またはActions画面からの手動実行時に開始します。同時に
複数の本番デプロイが走らないよう`production` concurrency groupを使用しています。
DBマイグレーションは本番DBを変更するため、自動デプロイには含めていません。
