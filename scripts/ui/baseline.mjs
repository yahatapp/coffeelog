import { verifyBrewForms } from "./brew-forms.mjs";
import { createBrewFixtures, brewIds } from "./brew-fixtures.mjs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { realpathSync } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const repo = process.cwd();
const require = createRequire(resolve(repo, "apps/brewlog/package.json"));
const { createServer } = await import(require.resolve("vite"));
const { default: react } = await import(require.resolve("@vitejs/plugin-react"));
const { default: tailwind } = await import(require.resolve("@tailwindcss/vite"));
const { chromium, expect } = require("@playwright/test");
const baseline = realpathSync(process.env.UI_SOURCE || "/tmp/coffeelog-baseline");
const output = resolve(repo, "docs/design-system/evidence", process.env.UI_PHASE || "before");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [index, app] of ["brewlog", "cafelog"].entries()) {
    const root = resolve(baseline, "apps", app);
    const server = await createServer({
      configFile: false,
      root,
      plugins: [
        {
          name: "ui-catalog-entry",
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
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
        tailwind(),
        {
          name: "ui-notice-fixture",
          transform(code, id) {
            if (process.env.UI_BREW_FORMS === "1" && id.endsWith("/src/main.tsx"))
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
            find: "@yahatapp/ui/foundation.css",
            replacement: resolve(repo, "packages/ui/src/styles/index.css"),
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
            replacement: resolve(baseline, "packages/ui/src/styles/tokens.css"),
          },
          { find: /^@yahatapp\/ui$/, replacement: resolve(baseline, "packages/ui/src/index.ts") },
          { find: "@", replacement: resolve(root, "src") },
        ],
      },
      server: {
        host: "127.0.0.1",
        port: 5271 + index,
        strictPort: true,
        fs: { allow: [repo, baseline] },
      },
    });
    await server.listen();
    try {
      for (const width of [320, 390]) {
        const context = await browser.newContext({
          viewport: { width, height: 844 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        await page.clock.setFixedTime(new Date("2026-10-31T03:00:00Z"));
        if (process.env.UI_SHELL === "1") {
          const cdp = await context.newCDPSession(page);
          await cdp.send("Emulation.setSafeAreaInsetsOverride", {
            insets: { top: 30, bottom: 34, left: 0, right: 0 },
          });
        }
        page.setDefaultTimeout(10000);
        const errors = [];
        const brewFixtures = createBrewFixtures();
        let saveMode = "success",
          saveCount = 0,
          releaseSave = null,
          readMode = "success";
        page.on("pageerror", (error) => {
          errors.push(error.message);
          console.log("browser error", error.message);
        });
        await page.route("https://**/*", (route) => route.abort());
        await page.route("**/api/**", async (route) => {
          const path = new URL(route.request().url()).pathname;
          const scenario = process.env.UI_SCENARIO;
          if (
            path === "/api/auth/init" &&
            new URL(page.url()).searchParams.get("uiAuth") === "expired"
          ) {
            await route.fulfill({
              status: 401,
              contentType: "application/json",
              body: JSON.stringify({ error: "expired" }),
            });
            return;
          }

          if (path !== "/api/auth/init" && scenario === "loading") {
            await new Promise(() => {});
            return;
          }
          if (
            path !== "/api/auth/init" &&
            (scenario === "error" ||
              (scenario === "save-error" && route.request().method() !== "GET"))
          ) {
            await route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ error: "検証用の通信エラー" }),
            });
            return;
          }
          if (process.env.UI_BREW_FORMS === "1" && app === "brewlog") {
            if (
              readMode === "error" &&
              route.request().method() === "GET" &&
              path.startsWith("/api/logs/")
            ) {
              await route.fulfill({
                status: 500,
                contentType: "application/json",
                body: JSON.stringify({ error: "fixture" }),
              });
              return;
            }
            const method = route.request().method();
            const payload = method === "GET" ? {} : route.request().postDataJSON();
            if (method !== "GET" && /^\/api\/(beans|logs)/.test(path)) {
              saveCount++;
              if (saveMode === "hold") {
                await new Promise((resolve) => {
                  releaseSave = async (status) => {
                    await route.fulfill({
                      status,
                      contentType: "application/json",
                      body: JSON.stringify(
                        status === 200
                          ? brewFixtures.respond(path, method, payload)
                          : { error: "検証用の保存失敗" },
                      ),
                    });
                    resolve();
                  };
                });
                return;
              }
            }
            const response = brewFixtures.respond(path, method, payload);
            if (response !== undefined) {
              await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(response),
              });
              return;
            }
          }
          let data = [];
          if (process.env.UI_COMPOSITES === "1" && path === "/api/stores")
            data = [
              { id: "fixture-store", name: "東京の店舗", prefecture: "東京都", links: [] },
              { id: "fixture-osaka", name: "大阪の店舗", prefecture: "大阪府", links: [] },
            ];
          if (path === "/api/stores/fixture-store")
            data = {
              store: { id: "fixture-store", name: "確認用の店舗", prefecture: "東京都", links: [] },
              cafeRecords: [
                {
                  id: "fixture-log",
                  visitDate: "2026-10-31",
                  flavorNotes: [],
                  rating: 4,
                  note: "確認用の記録",
                },
              ],
              brewRecords: [],
            };
          if (path === "/api/auth/init")
            data = {
              profile: { lineUserId: "fixture-user", displayName: "確認用ユーザー" },
              household: { id: "fixture-household", name: "確認用" },
            };
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(data),
          });
        });
        for (const [name, path] of [
          ["home", "/"],
          ["form", app === "brewlog" ? "/beans/new" : "/logs/new"],
          ["stores", "/stores"],
          ["settings", "/settings"],
          ["modal", "/stores/fixture-store"],
        ]) {
          await page.goto(`http://127.0.0.1:${5271 + index}${path}`);
          await page.getByRole("navigation").waitFor();
          console.log(app, width, page.url());
          if (process.env.UI_SHELL === "1") {
            const nav = page.getByRole("navigation");
            if (Math.abs((await nav.evaluate((el) => el.getBoundingClientRect().height)) - 106) > 1)
              throw new Error("Safe-area not included in navigation height");
            await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
            for (const link of await nav.getByRole("link").all()) {
              const box = await link.boundingBox();
              if (!box || box.height < 44 || box.width < 44)
                throw new Error("Navigation target too small");
            }
            if ((await page.locator('[data-clarity-mask="True"]').count()) !== 1)
              throw new Error("Analytics mask missing");
          }

          if (name === "form")
            await page
              .locator(
                "input:not([type=radio]):not([type=checkbox]):not([type=file]):not([type=date]):not([type=number])",
              )
              .first()
              .fill("確認用の長い日本語の入力");
          if (name === "stores" && process.env.UI_COMPOSITES === "1") {
            await page.getByRole("button", { name: "都道府県順", exact: true }).click();
            await page.getByRole("button", { name: "店舗を検索", exact: true }).click();
            const search = page.getByRole("searchbox");
            await search.fill("東京都");
            await expect(page.getByRole("button", { name: /東京の店舗/ })).toBeVisible();
            await expect(page.getByRole("button", { name: /大阪の店舗/ })).toHaveCount(0);
            await search.fill("存在しない店舗");
            await expect(page.getByText("店舗が見つかりません。")).toBeVisible();
            await page.getByRole("button", { name: "検索を閉じる", exact: true }).click();
            await expect(page.getByRole("button", { name: /大阪の店舗/ })).toBeVisible();
          }
          if (name === "modal") {
            await page.getByRole("button", { name: /2026/ }).click();
            await page.getByRole("dialog").waitFor();
            if (process.env.UI_COMPOSITES === "1") {
              const dialog = page.getByRole("dialog");
              if ((await dialog.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop))) < 16)
                throw new Error("Reset overrode dialog padding");
              await expect
                .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
                .toBe(true);
              for (let i = 0; i < 4; i++) {
                await page.keyboard.press("Tab");
                await expect
                  .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)), {
                    timeout: 1500,
                  })
                  .toBe(true);
              }
              const { default: AxeBuilder } = await import("@axe-core/playwright");
              const audit = await new AxeBuilder({ page })
                .include('[role="dialog"]')
                .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
                .analyze();
              if (audit.violations.length)
                throw new Error(
                  JSON.stringify(
                    audit.violations.map((v) => ({
                      id: v.id,
                      nodes: v.nodes.map((n) => n.target),
                    })),
                  ),
                );
            }
          }
          if (name === "form" && process.env.UI_SHELL === "1") {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            const save = page.getByRole("button", { name: /保存/ }).last();
            const navBox = await page.getByRole("navigation").boundingBox();
            const saveBox = await save.boundingBox();
            if (!saveBox || saveBox.y + saveBox.height > navBox.y)
              throw new Error("Save action obscured by navigation");
          }
          await page.waitForTimeout(700);
          await page.screenshot({
            path: resolve(output, `${app}-${name}-${width}.png`),
            fullPage: true,
            animations: "allow",
            timeout: 10000,
          });
          results.push({
            app,
            width,
            path,
            tokens: await page.evaluate(() => ({
              theme: document.documentElement.dataset.appTheme,
              primary: getComputedStyle(document.documentElement)
                .getPropertyValue("--cl-color-action-primary")
                .trim(),
            })),
            errors: [...errors],
            inputs: await page.locator("input").count(),
          });
          if (name === "modal" && process.env.UI_COMPOSITES === "1") {
            await page.keyboard.press("Escape");
            await expect(page.getByRole("dialog")).toHaveCount(0);
            await expect(page.getByRole("button", { name: /2026/ })).toBeFocused();
          }
        }
        await page.goto(`http://127.0.0.1:${5271 + index}/`);
        await page.getByRole("navigation").waitFor();
        console.log(app, width, page.url());
        await page.evaluate(() =>
          globalThis.__uiNotify({ message: "確認用の保存完了通知", variant: "warning" }),
        );
        await page
          .getByRole("region", { name: "操作結果の通知" })
          .getByText("確認用の保存完了通知")
          .waitFor({ timeout: 10000 });
        await page.waitForTimeout(700);
        await page.screenshot({
          path: resolve(output, `${app}-notice-${width}.png`),
          fullPage: true,
          animations: "allow",
          timeout: 10000,
        });
        console.log(
          "notice captured",
          await page.locator('[aria-label="通知を閉じる"]').evaluate((el) => el.outerHTML),
        );
        await page.locator('[aria-label="通知を閉じる"]').focus();
        if (process.env.UI_COMPOSITES === "1") {
          await expect(
            page.getByRole("button", { name: "通知を閉じる", exact: true }),
          ).toBeVisible();
          const { default: AxeBuilder } = await import("@axe-core/playwright");
          const audit = await new AxeBuilder({ page })
            .include('[aria-label="操作結果の通知"]')
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          if (audit.violations.length)
            throw new Error(
              JSON.stringify(
                audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
              ),
            );
        }

        await page.keyboard.press("Enter");
        await page
          .getByRole("region", { name: "操作結果の通知" })
          .getByText("確認用の保存完了通知")
          .waitFor({ state: "hidden", timeout: 10000 });
        results.push({
          app,
          width,
          path: "notification",
          closed: true,
          tokens: await page.locator("body").evaluate((el) => ({
            primary: getComputedStyle(el).getPropertyValue("--cl-color-action-primary").trim(),
          })),
          errors: [...errors],
        });

        if (process.env.UI_SHELL === "1") {
          for (const [label, value] of [
            ["許可する", "enabled"],
            ["許可しない", "disabled"],
          ]) {
            await page.evaluate(
              (app) => localStorage.removeItem(`coffeelog.analytics.${app}.v1`),
              app,
            );
            await page.goto(`http://127.0.0.1:${5271 + index}/`);
            await expect(
              page.getByRole("complementary", { name: "利用状況の計測について" }),
            ).toBeVisible();
            await Promise.all([
              page.waitForEvent("domcontentloaded"),
              page.getByRole("button", { name: label, exact: true }).click(),
            ]);
            await page.getByRole("navigation").waitFor();
            if (
              (await page.evaluate(
                (app) => localStorage.getItem(`coffeelog.analytics.${app}.v1`),
                app,
              )) !== value
            )
              throw new Error("Consent not stored");
          }
          await page.goto(`http://127.0.0.1:${5271 + index}/?uiAuth=loading`);
          await expect(page.getByRole("status")).toContainText("読み込み中");
          await page.screenshot({ path: resolve(output, `${app}-auth-loading-${width}.png`) });
          await page.goto(`http://127.0.0.1:${5271 + index}/?uiAuth=error`);
          await expect(page.getByText("検証用の認証エラー")).toBeVisible();
          await page.screenshot({ path: resolve(output, `${app}-auth-error-${width}.png`) });
          await page.goto(`http://127.0.0.1:${5271 + index}/?uiAuth=expired`);
          await page.getByRole("button", { name: "LINEで再ログイン" }).click();
          if ((await page.evaluate(() => globalThis.__uiLoginCount)) !== 1)
            throw new Error("Relogin not called");
          results.push({
            app,
            width,
            path: "shell",
            consent: true,
            auth: true,
            navigation: true,
            errors: [...errors],
          });
        }
        if (process.env.UI_BREW_FORMS === "1" && app === "brewlog") {
          await verifyBrewForms(page, {
            baseURL: `http://127.0.0.1:${5271 + index}`,
            output,
            width,
            ids: brewIds,
            hold: () => {
              saveMode = "hold";
              releaseSave = null;
            },
            count: () => saveCount,
            release: async (status) => {
              if (!releaseSave) throw new Error("No pending save");
              await releaseSave(status);
            },
            readMode: (value) => {
              readMode = value;
            },
          });
          results.push({ app, width, path: "brew-forms", verified: true, errors: [...errors] });
        }
        if (process.env.UI_CATALOG === "1") {
          await page.goto(`http://127.0.0.1:${5271 + index}/__catalog`);
          await page.getByRole("heading", { name: "UI部品の確認" }).waitFor();
          const { default: AxeBuilder } = await import("@axe-core/playwright");
          const audit = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          await writeFile(
            resolve(output, `${app}-catalog-${width}-axe.json`),
            JSON.stringify(audit.violations, null, 2),
          );
          if (process.env.UI_COMPOSITES === "1") {
            if (audit.violations.length)
              throw new Error(
                JSON.stringify(
                  audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
                ),
              );
            const status = page.getByRole("status");
            await expect(status).toContainText("読み込み中");
            await page.getByRole("button", { name: /ホット/ }).click();
            await expect(page.getByRole("button", { name: /ホット/ })).toHaveAttribute(
              "aria-pressed",
              "true",
            );
            await page.getByRole("button", { name: "評価で降順に並べ替え", exact: true }).click();
            await expect(
              page.getByRole("button", { name: "評価で昇順に並べ替え", exact: true }),
            ).toHaveAttribute("aria-pressed", "true");

            if (
              (await status
                .locator("span[aria-hidden]")
                .evaluate((el) => getComputedStyle(el).animationName)) !== "none"
            )
              throw new Error("Reduced motion not applied");
          }
          const basic = await new AxeBuilder({ page })
            .include('section[aria-label="基本部品"]')
            .include('section[aria-label="入力部品"]')
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          if (basic.violations.length)
            throw new Error(
              JSON.stringify(
                basic.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
              ),
            );
          if (!(await page.getByRole("button", { name: "保存中", exact: true }).isDisabled()))
            throw new Error("Loading button enabled");
          const link = page.getByRole("link", { name: "保存中のリンク" });
          await link.focus();
          await page.keyboard.press("Enter");
          if (new URL(page.url()).hash) throw new Error("Disabled link navigated");
          const field = page.getByRole("textbox", { name: "店名" });
          if (
            (await field.getAttribute("aria-invalid")) !== "true" ||
            !(await field.getAttribute("aria-describedby"))
          )
            throw new Error("Field association missing");
          await page.getByRole("radiogroup").locator("label").filter({ hasText: "アイス" }).click();
          if (!(await page.getByRole("radio", { name: "アイス", exact: true }).isChecked()))
            throw new Error("Segment pointer selection failed");
          await page.getByRole("radio", { name: "ホット", exact: true }).focus();
          await page.keyboard.press("Space");
          if (!(await page.getByRole("radio", { name: "ホット", exact: true }).isChecked()))
            throw new Error("Segment keyboard selection failed");
          for (const size of ["sm", "md", "lg", "icon"]) {
            const box = await page
              .getByRole("button", { name: `サイズ ${size}`, exact: true })
              .boundingBox();
            if (!box || box.height < 44) throw new Error(`Insufficient target size: ${size}`);
          }
          const primary = page.getByRole("button", { name: "primary", exact: true });
          await primary.hover();
          await expect
            .poll(() => primary.evaluate((el) => getComputedStyle(el).backgroundColor), {
              timeout: 3000,
            })
            .toBe(app === "brewlog" ? "rgb(93, 65, 46)" : "rgb(36, 65, 18)");
          await primary.focus();
          if ((await primary.evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth))) < 2)
            throw new Error("Focus outline missing");

          await page.screenshot({
            path: resolve(output, `${app}-catalog-${width}.png`),
            fullPage: true,
            animations: "allow",
          });
        }
        await context.close();
      }
    } finally {
      await server.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(resolve(output, "results.json"), JSON.stringify(results, null, 2) + "\n");
if (results.some((r) => r.errors.length)) throw new Error("Browser errors: inspect results.json");
console.log(`Captured ${results.length} verification cases.`);
