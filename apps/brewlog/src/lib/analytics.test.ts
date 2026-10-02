import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnalytics, safePagePath } from "@yahatapp/analytics";

declare global {
  interface Window {
    dataLayer?: unknown[][];
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analytics privacy boundary", () => {
  it("normalizes record URLs and ignores unknown paths", () => {
    expect(safePagePath("/logs/new")).toBe("/logs/new");
    expect(safePagePath("/logs/private-record-id/edit")).toBe("/logs/:id/edit");
    expect(safePagePath("/beans/private-bean-id")).toBe("/beans/:id");
    expect(safePagePath("/unknown/private-value")).toBe("/not-found");
  });

  it("does not load tags or send events without consent", () => {
    const append = vi.fn();
    vi.stubGlobal("window", {
      localStorage: { getItem: () => null },
      location: { origin: "https://example.test", pathname: "/logs/private-record-id" },
    });
    vi.stubGlobal("document", { head: { append }, createElement: vi.fn() });
    const analytics = createAnalytics({
      app: "brewlog",
      gaId: "G-TEST123",
      clarityId: "test123",
      production: true,
    });

    analytics.trackPage("/logs/private-record-id");
    analytics.trackEvent("record_create_success");

    expect(append).not.toHaveBeenCalled();
  });

  it("sends only a normalized GA page location after consent", () => {
    const append = vi.fn();
    vi.stubGlobal("window", {
      localStorage: { getItem: () => "enabled" },
      location: { origin: "https://example.test", pathname: "/logs/private-record-id" },
    });
    vi.stubGlobal("document", {
      head: { append },
      createElement: () => ({ async: false, src: "" }),
    });
    const analytics = createAnalytics({
      app: "brewlog",
      gaId: "G-TEST123",
      production: true,
    });

    analytics.trackPage("/logs/private-record-id");
    analytics.trackPage("/logs/private-record-id");

    const dataLayer = window.dataLayer ?? [];
    const pageViews = dataLayer.filter((entry) => entry[1] === "page_view");
    expect(pageViews).toHaveLength(1);
    expect(pageViews[0]?.[2]).toMatchObject({
      page_location: "https://example.test/logs/:id",
      page_path: "/logs/:id",
    });
    expect(JSON.stringify(dataLayer)).not.toContain("private-record-id");
    expect(append).toHaveBeenCalledTimes(1);
  });

  it("loads Clarity only for consented sessions and denies advertising storage", () => {
    const scripts: string[] = [];
    vi.stubGlobal("window", {
      localStorage: { getItem: () => "enabled" },
      location: { origin: "https://example.test", pathname: "/" },
    });
    vi.stubGlobal("document", {
      head: { append: (script: { src: string }) => scripts.push(script.src) },
      createElement: () => ({ async: false, src: "" }),
    });
    const analytics = createAnalytics({
      app: "brewlog",
      clarityId: "test123",
      production: true,
    });

    analytics.trackPage("/");

    expect(scripts).toEqual(["https://www.clarity.ms/tag/test123"]);
    expect(Reflect.get(window, "clarity")).toHaveProperty("q", [
      ["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }],
      ["event", "app_open"],
    ]);
  });
});
