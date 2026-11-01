import { createRequire } from "node:module";
import { resolve } from "node:path";
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
const repo = process.cwd();
const require = createRequire(resolve(repo, "apps/brewlog/package.json"));
const { createServer } = await import(require.resolve("vite"));
const { default: react } = await import(require.resolve("@vitejs/plugin-react"));
export async function startUIServer({ app, port, source = repo, testing = true }) {
  const baseline = realpathSync(source);
  const root = resolve(baseline, "apps", app);
  const server = await createServer({
    configFile: false,
    root,
    plugins: [
      {
        name: "ui-catalog-entry",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!testing && req.url === "/") {
              res.statusCode = 302;
              res.setHeader("Location", "/__catalog");
              res.end();
              return;
            }
            if (req.url?.split("?")[0] !== "/__catalog") {
              next();
              return;
            }
            const html = (await readFile(resolve(root, "index.html"), "utf8")).replace(
              "/src/main.tsx",
              "/@fs" + resolve(repo, "scripts/ui/catalog.tsx"),
            );
            res.setHeader("Content-Type", "text/html");
            res.end(
              await server.transformIndexHtml(
                "/__catalog",
                html.replace(
                  "</head>",
                  `<script type="module">import '/@fs${root}/src/index.css';</script></head>`,
                ),
              ),
            );
          });
        },
      },
      react(),
      {
        name: "ui-notice-fixture",
        transform(code, id) {
          if (!testing) return;
          if (
            (process.env.UI_BREW_FORMS === "1" || process.env.UI_CAFE_FORMS === "1") &&
            (id.endsWith("/src/main.tsx") || id.endsWith("/src/lib/queryClient.ts"))
          )
            return code.replace("queries: {", "queries: { retry: false,");
          if (process.env.UI_SHELL === "1" && id.endsWith("/src/lib/analytics.ts"))
            return code
              .replace("production: import.meta.env.PROD", "production: true")
              .replace("gaId: import.meta.env.VITE_GA4_MEASUREMENT_ID", 'gaId: "G-FIXTURE"');
          if (id.endsWith("/lib/notices.ts")) return code + "\nglobalThis.__uiNotify = notify;";
        },
      },
    ],
    resolve: {
      alias: [
        { find: /^react$/, replacement: require.resolve("react") },
        { find: /^react-dom\/client$/, replacement: require.resolve("react-dom/client") },
        { find: /^react\/jsx-runtime$/, replacement: require.resolve("react/jsx-runtime") },
        {
          find: /^react\/jsx-dev-runtime$/,
          replacement: require.resolve("react/jsx-dev-runtime"),
        },
        {
          find: "@yahatapp/ui/themes/brewlog.css",
          replacement: resolve(repo, "packages/ui/src/styles/themes/brewlog.css"),
        },
        {
          find: "@yahatapp/ui/themes/cafelog.css",
          replacement: resolve(repo, "packages/ui/src/styles/themes/cafelog.css"),
        },
        { find: "@line/liff", replacement: resolve(repo, "scripts/ui/liff-fixture.mjs") },
        {
          find: "@yahatapp/ui/styles.css",
          replacement: resolve(baseline, "packages/ui/src/styles/index.css"),
        },
        { find: /^@yahatapp\/ui$/, replacement: resolve(baseline, "packages/ui/src/index.ts") },
        { find: "@", replacement: resolve(root, "src") },
      ],
    },
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      fs: { allow: [repo, baseline] },
    },
  });
  await server.listen();
  return server;
}
