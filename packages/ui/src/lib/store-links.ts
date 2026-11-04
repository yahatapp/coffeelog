export const STORE_LINK_TYPES = ["instagram", "google_maps", "website"] as const;

export type StoreLinkType = (typeof STORE_LINK_TYPES)[number];

export const classifyStoreLink = (value: string): StoreLinkType => {
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
