export const CAFE_LINK_TYPES = ["instagram", "google_maps", "website"] as const;

export type CafeLinkType = (typeof CAFE_LINK_TYPES)[number];

export const classifyCafeLink = (value: string): CafeLinkType => {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
    return "instagram";
  }

  if (
    hostname === "maps.app.goo.gl" ||
    hostname === "maps.google.com" ||
    hostname === "maps.google.co.jp" ||
    (hostname.startsWith("google.") && url.pathname.startsWith("/maps")) ||
    (hostname.endsWith(".google.com") && url.pathname.startsWith("/maps")) ||
    (hostname === "goo.gl" && url.pathname.startsWith("/maps"))
  ) {
    return "google_maps";
  }

  return "website";
};
