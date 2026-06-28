# Cafelog ☕

カフェで飲んだコーヒーの評価を記録する LINE LIFF App。

## Tech Stack

| Layer               | Technology                                                         |
| ------------------- | ------------------------------------------------------------------ |
| **Frontend**        | React 19 + Vite 8 + TailwindCSS v4                                 |
| **Backend**         | Hono (Cloudflare Workers)                                          |
| **Database**        | Drizzle ORM + postgres.js → Supabase PostgreSQL (`cafelog` schema) |
| **Auth**            | LINE LIFF ID Token → jose (JWKS) + Allowlist                       |
| **API Client**      | Hono RPC (`hc`) for E2E type safety                                |
| **Package Manager** | pnpm                                                               |
| **Dev Environment** | Nix (flake.nix) + direnv                                           |

## Architecture

```
LINE LIFF (React + Vite)
    ↕ Hono RPC (E2E Type Safe)
Cloudflare Workers (Hono API)
    ↕ Drizzle ORM
Supabase PostgreSQL (cafelog schema)
```

## Relation to Brewlog

- **同じ Supabase DB** を使用（`cafelog` スキーマで分離）
- **同じ LINE プロバイダ**（別チャネル・別LIFF App）
- **別の Cloudflare Worker**（`cafelog`）

## Getting Started

### Prerequisites

- Node.js 24+ (Nix で管理)
- pnpm
- Supabase PostgreSQL DB（Brewlogと共有）
- LINE Developers アカウント（新規チャネル作成済み）

### Setup

```bash
# 1. Nix 開発環境を有効化
direnv allow

# 2. 依存関係のインストール
pnpm install

# 3. 環境変数の設定
cp .env.example .env
# .env, .env.development, .dev.vars を編集

# 4. DB スキーマ作成 & マイグレーション
pnpm run db:generate
pnpm run db:migrate

# 5. 開発サーバー起動
pnpm run dev
```

### Deploy

```bash
# Cloudflare Workers にデプロイ
pnpm run deploy

# シークレットの設定（初回のみ）
wrangler secret put DATABASE_URL
wrangler secret put LINE_CHANNEL_ID
wrangler secret put ALLOWED_LINE_USER_IDS
```

## Environment Variables

詳細は [.env.example](./.env.example) を参照してください。
