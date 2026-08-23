import { describe, expect, it, vi } from "vitest";
import app from "./index";
import type { Env } from "./types";

const bindings: Env["Bindings"] = {
  DATABASE_URL: "postgres://guardrail.invalid/brewlog",
  LINE_CHANNEL_ID: "guardrail-channel-id",
  ALLOWED_LINE_USER_IDS: "guardrail-user-id",
};

const concretePath = (path: string) =>
  path.replaceAll(/:[^/]+/g, "00000000-0000-4000-8000-000000000000");

describe("API authentication boundary", () => {
  const protectedRoutes = app.routes.filter((route) => route.method !== "ALL");

  it("registers business routes behind the global middleware", () => {
    expect(protectedRoutes.length).toBeGreaterThan(0);
  });

  for (const route of protectedRoutes) {
    it(`${route.method} ${route.path} rejects a missing ID token before accessing data`, async () => {
      const response = await app.request(
        concretePath(route.path),
        { method: route.method },
        bindings,
      );
      const body = await response.text();

      expect(response.status).toBe(401);
      expect(body).not.toContain(bindings.DATABASE_URL);
      expect(body).not.toContain(bindings.LINE_CHANNEL_ID);
      expect(body).not.toContain(bindings.ALLOWED_LINE_USER_IDS);
    });
  }

  it("does not expose JWT parser details for an invalid token", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const response = await app.request(
        "/api/beans",
        { headers: { Authorization: "Bearer invalid-token" } },
        bindings,
      );
      const body = await response.text();

      expect(response.status).toBe(401);
      expect(body).toBe("Unauthorized: Invalid ID Token");
    } finally {
      consoleError.mockRestore();
    }
  });
});
