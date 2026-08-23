import { hc } from "hono/client";
import type { AppType } from "@/api";

let apiToken: string | null = null;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const assertOk = async <
  T extends { ok: boolean; status: number; text: () => Promise<string> },
>(
  response: T,
) => {
  if (response.ok) return response;
  const message = await response.text();
  throw new ApiError(response.status, message || `Request failed (${response.status})`);
};

export const setApiToken = (token: string | null) => {
  apiToken = token;
};

export const authorizedFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (apiToken) headers.set("Authorization", `Bearer ${apiToken}`);
  return fetch(input, { ...init, headers });
};

export const api = hc<AppType>("/", {
  headers: (): Record<string, string> => {
    return apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
  },
});
