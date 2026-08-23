import { hc } from "hono/client";
import type { AppType } from "@/api";

let apiToken: string | null = null;

export const setApiToken = (token: string | null) => {
  apiToken = token;
};

export const api = hc<AppType>("/", {
  headers: (): Record<string, string> => {
    return apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
  },
});
