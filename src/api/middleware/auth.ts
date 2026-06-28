import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../types";

// LINEの公開鍵(JWKS)のエンドポイント
const JWKS_URL = new URL("https://api.line.me/oauth2/v2.1/certs");
const JWKS = createRemoteJWKSet(JWKS_URL);

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Unauthorized: Missing ID Token" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    // 1. 署名とペイロードの検証 (許容クロックスキューを60秒に設定)
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: "https://access.line.me",
      audience: c.env.LINE_CHANNEL_ID,
      clockTolerance: 60,
    });

    const sub = payload.sub;

    if (!sub) {
      throw new HTTPException(401, { message: "Invalid token: sub missing" });
    }

    // 2. Allowlistチェック (認可)
    if (!c.env.ALLOWED_LINE_USER_IDS) {
      throw new HTTPException(500, { message: "Internal Server Error: Missing configuration" });
    }
    const allowedIds = c.env.ALLOWED_LINE_USER_IDS.split(",").map((id) => id.trim());

    if (!allowedIds.includes(sub)) {
      console.warn(`Access denied for user: ${sub}`);
      throw new HTTPException(403, { message: "Forbidden: Access denied" });
    }

    // 後続のハンドラで利用できるようにセット
    c.set("lineUserId", sub);

    await next();
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;

    console.error("JWT Verification failed:", error);
    throw new HTTPException(401, {
      message: `Unauthorized: Invalid ID Token: ${error?.message || error}`,
      cause: error,
    });
  }
});
