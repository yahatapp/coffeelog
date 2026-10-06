# Coffeelog Monorepo

This repository contains two independently deployed LINE LIFF applications:

- `apps/brewlog`: home-brewing records
- `apps/cafelog`: café visit and coffee records

pnpm workspaces manage dependencies and Turborepo orchestrates checks, tests, and builds. Each app keeps its own Cloudflare Worker, Wrangler configuration, database migrations, LIFF ID, and production deployment. `packages/database` defines both record schemas and the shared store directory.

## Development

Enter the Nix development shell and install the workspace dependencies once from the repository root:

```sh
nix develop
pnpm install --frozen-lockfile
```

Common commands:

```sh
pnpm dev
pnpm check
pnpm test
pnpm build
pnpm turbo run check test build --affected
```

Run a command for one application with a pnpm filter:

```sh
pnpm --filter brewlog dev
pnpm --filter cafelog test
```

## CI/CD

CI uses Turborepo's affected-package detection. Production deployments remain independent and are selected by changed paths:

- `.github/workflows/deploy-brewlog.yml`
- `.github/workflows/deploy-cafelog.yml`

Create these GitHub Environments in the monorepo repository before enabling deployments:

| Environment          | Secrets                                                         | Variable                                                             |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `production-brewlog` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `DATABASE_URL` | `VITE_LIFF_ID`, `VITE_GA4_MEASUREMENT_ID`, `VITE_CLARITY_PROJECT_ID` |
| `production-cafelog` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `DATABASE_URL` | `VITE_LIFF_ID`, `VITE_GA4_MEASUREMENT_ID`, `VITE_CLARITY_PROJECT_ID` |

The deploy workflows apply the shared, Cafelog and Brewlog database migrations together, then deploy only that application's Worker. The migration command uses a transaction advisory lock to serialize concurrent deployments and preserve consistency across the shared store history. A change under `packages/` or to root build configuration intentionally triggers both deployments.

店舗登録・共有とデータ移行の詳細は [docs/stores.md](docs/stores.md) を参照してください。

GA4とClarityの設定・同意・検証手順は [docs/analytics.md](docs/analytics.md) を参照してください。
