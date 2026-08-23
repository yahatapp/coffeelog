# LINE Coffee Apps Monorepo

This repository contains two independently deployed LINE LIFF applications:

- `apps/brewlog`: home-brewing records
- `apps/cafelog`: café visit and coffee records

pnpm workspaces manage dependencies and Turborepo orchestrates checks, tests, and builds. Each app keeps its own Cloudflare Worker, Wrangler configuration, database migrations, LIFF ID, and production deployment.

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

| Environment | Secrets | Variable |
| --- | --- | --- |
| `production-brewlog` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `DATABASE_URL` | `VITE_LIFF_ID` |
| `production-cafelog` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `DATABASE_URL` | `VITE_LIFF_ID` |

The deploy workflows apply only that application's database migrations and deploy only that application's Worker. A change under `packages/` or to root build configuration intentionally triggers both deployments.
