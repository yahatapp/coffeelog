import { setTimeout } from "node:timers/promises";

// Read existing production Worker settings before any database changes. This
// checks token/account/Worker access, not every permission needed by a deploy.
export async function checkCloudflareDeploy(
  appName,
  env = process.env,
  { request = fetch, sleep = setTimeout, warn = console.warn } = {},
) {
  if (!["brewlog", "cafelog"].includes(appName)) {
    throw new Error("Usage: node scripts/check-cloudflare-deploy.mjs <brewlog|cafelog>");
  }
  const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: token } = env;
  if (!accountId || !token) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set.");
  }
  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID must be a 32-character account ID.");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${appName}/settings`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    let response;
    try {
      response = await request(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // Do not print request errors: they can contain authentication details.
      throw new Error("Cloudflare access check could not reach the API within 15 seconds.");
    }
    const body = await response.json().catch(() => null);
    if (response.ok && body?.success === true) return;

    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      const retryAfter = response.headers.get("retry-after");
      const seconds = retryAfter === null ? NaN : Number(retryAfter);
      const dateDelay = Date.parse(retryAfter ?? "") - Date.now();
      const delay = Math.max(
        attempt * 30_000,
        Number.isFinite(seconds) ? seconds * 1_000 : dateDelay || 0,
      );
      // Do not hammer the API if it requests a longer wait than this job allows.
      if (delay <= 120_000) {
        warn(
          `Cloudflare API returned HTTP ${response.status}; retrying access check (${attempt}/3).`,
        );
        await sleep(delay);
        continue;
      }
    }

    // API messages and response bodies may contain sensitive data. Report only
    // numeric codes, then direct maintainers to the Environment that owns them.
    const codes = (Array.isArray(body?.errors) ? body.errors : [])
      .map((error) => error?.code)
      .filter(Number.isInteger);
    throw new Error(
      `Cloudflare access check failed (HTTP ${response.status}; codes: ${codes.join(", ") || "none"}). ` +
        `Check CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in production-${appName}. ` +
        "Database migrations and deployment have not started. See docs/deployment.md.",
    );
  }
}

if (import.meta.main) {
  try {
    await checkCloudflareDeploy(process.argv[2]);
    console.log("Cloudflare Worker access confirmed.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
