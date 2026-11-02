import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { checkCloudflareDeploy } from "./check-cloudflare-deploy.mjs";

const env = { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: "test-token" };
const reply = (status, body, headers) => new Response(JSON.stringify(body), { status, headers });

test("checks the requested production Worker with the Environment token", async () => {
  for (const app of ["brewlog", "cafelog"]) {
    await checkCloudflareDeploy(app, env, {
      request: async (url, options) => {
        assert.equal(
          url,
          `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${app}/settings`,
        );
        assert.equal(options.headers.Authorization, `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
        return reply(200, { success: true });
      },
    });
  }
});

test("rejects missing configuration and unknown Workers before calling the API", async () => {
  const request = () => assert.fail("must not call Cloudflare");
  for (const [app, config] of [
    ["unknown", env],
    ["brewlog", {}],
    ["brewlog", { ...env, CLOUDFLARE_ACCOUNT_ID: "invalid" }],
  ]) {
    await assert.rejects(checkCloudflareDeploy(app, config, { request }));
  }
});

test("fails immediately on invalid tokens without printing response details", async () => {
  await assert.rejects(
    checkCloudflareDeploy("brewlog", env, {
      request: async () =>
        reply(403, { success: false, errors: [{ code: 9109, message: env.CLOUDFLARE_API_TOKEN }] }),
      sleep: () => assert.fail("must not retry invalid credentials"),
    }),
    (error) => {
      assert.match(error.message, /HTTP 403; codes: 9109/);
      assert.match(error.message, /production-brewlog/);
      assert.ok(!error.message.includes(env.CLOUDFLARE_API_TOKEN));
      return true;
    },
  );
});

test("retries transient failures and honors Retry-After", async () => {
  const responses = [
    reply(429, {}, { "Retry-After": "45" }),
    reply(503, {}),
    reply(200, { success: true }),
  ];
  const delays = [];
  await checkCloudflareDeploy("cafelog", env, {
    request: async () => responses.shift(),
    sleep: async (delay) => delays.push(delay),
    warn: () => {},
  });
  assert.deepEqual(delays, [45_000, 60_000]);
});

test("bounds retries and refuses to shorten a long Retry-After", async () => {
  for (const retryAfter of [undefined, "300"]) {
    let calls = 0;
    await assert.rejects(
      checkCloudflareDeploy("cafelog", env, {
        request: async () => {
          calls++;
          return reply(429, {}, retryAfter ? { "Retry-After": retryAfter } : {});
        },
        sleep: async () => {},
        warn: () => {},
      }),
      /HTTP 429/,
    );
    assert.equal(calls, retryAfter ? 1 : 3);
  }
});

test("fails closed for malformed responses and redacts network errors", async () => {
  await assert.rejects(
    checkCloudflareDeploy("brewlog", env, { request: async () => new Response("not JSON") }),
  );
  await assert.rejects(
    checkCloudflareDeploy("brewlog", env, {
      request: async () => {
        throw new Error(env.CLOUDFLARE_API_TOKEN);
      },
    }),
    (error) => !error.message.includes(env.CLOUDFLARE_API_TOKEN),
  );
});

test("CLI exits unsuccessfully when credentials are missing", () => {
  const result = spawnSync(process.execPath, ["scripts/check-cloudflare-deploy.mjs", "brewlog"], {
    env: {},
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be set/);
});

test("both deployment workflows check access before migrations and deploy", () => {
  for (const app of ["brewlog", "cafelog"]) {
    const workflow = readFileSync(
      new URL(`../.github/workflows/deploy-${app}.yml`, import.meta.url),
      "utf8",
    );
    const preflight = workflow.indexOf(`node scripts/check-cloudflare-deploy.mjs ${app}`);
    const migrate = workflow.indexOf(`pnpm --filter ${app} db:migrate`);
    const deploy = workflow.indexOf(`pnpm --filter ${app} deploy:built`);
    assert.ok(preflight > 0 && preflight < migrate && migrate < deploy);
    const step = workflow.slice(workflow.lastIndexOf("      - name:", preflight), preflight);
    assert.match(step, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets.CLOUDFLARE_API_TOKEN \}\}/);
    assert.match(step, /CLOUDFLARE_ACCOUNT_ID: \$\{\{ secrets.CLOUDFLARE_ACCOUNT_ID \}\}/);
  }
});
