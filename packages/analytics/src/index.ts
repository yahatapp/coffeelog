export type AnalyticsEvent =
  | "app_open"
  | "record_create_start"
  | "record_create_success"
  | "record_create_error"
  | "record_update_success"
  | "record_update_error"
  | "bean_create_success"
  | "photo_add"
  | "filter_change"
  | "sort_change"
  | "external_link_click";

export type AnalyticsConsent = "enabled" | "disabled" | null;

type Gtag = (...args: unknown[]) => void;
type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: Gtag;
  clarity?: Clarity;
};

type AnalyticsConfig = {
  app: "brewlog" | "cafelog";
  gaId?: string;
  clarityId?: string;
  production: boolean;
};

const routePatterns = [
  /^\/$/,
  /^\/(beans|logs|settings)$/,
  /^\/(beans|logs)\/new$/,
  /^\/(beans|logs)\/[^/]+\/edit$/,
  /^\/(beans|logs)\/[^/]+$/,
  /^\/settings\/(drippers|grinders)$/,
];

export function safePagePath(pathname: string): string {
  const path = pathname.replace(/\/$/, "") || "/";
  if (!routePatterns.some((pattern) => pattern.test(path))) return "/not-found";
  if (path === "/beans/new" || path === "/logs/new") return path;
  return path.replace(/^\/(beans|logs)\/[^/]+(\/edit)?$/, "/$1/:id$2");
}

export function createAnalytics(config: AnalyticsConfig) {
  const gaId = /^G-[A-Z0-9]+$/.test(config.gaId ?? "") ? config.gaId : undefined;
  const clarityId = /^[a-z0-9]+$/i.test(config.clarityId ?? "")
    ? config.clarityId
    : undefined;
  const configured = config.production && Boolean(gaId || clarityId);
  const servicesLabel = [gaId && "GA4", clarityId && "Clarity"].filter(Boolean).join("と");
  const storageKey = `coffeelog.analytics.${config.app}.v1`;
  let initialized = false;
  let lastPage: string | null = null;

  function getConsent(): AnalyticsConsent {
    if (!configured || typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored === "enabled" || stored === "disabled" ? stored : null;
    } catch {
      return null;
    }
  }

  function setConsent(consent: Exclude<AnalyticsConsent, null>): void {
    try {
      window.localStorage.setItem(storageKey, consent);
    } catch {
      if (consent === "enabled") return;
    }
    if (consent === "disabled") {
      (window as AnalyticsWindow).gtag?.("consent", "update", {
        analytics_storage: "denied",
      });
      (window as AnalyticsWindow).clarity?.("consentv2", {
        ad_Storage: "denied",
        analytics_Storage: "denied",
      });
    }
    window.location.reload();
  }

  function initialize(): void {
    if (initialized || getConsent() !== "enabled") return;
    initialized = true;
    const analyticsWindow = window as AnalyticsWindow;

    if (gaId) {
      analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
      analyticsWindow.gtag = (...args: unknown[]) => {
        analyticsWindow.dataLayer?.push(args);
      };
      analyticsWindow.gtag("js", new Date());
      analyticsWindow.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      analyticsWindow.gtag(
        "set",
        "page_location",
        `${window.location.origin}${safePagePath(window.location.pathname)}`,
      );
      analyticsWindow.gtag("set", "page_referrer", window.location.origin);
      analyticsWindow.gtag("config", gaId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.append(script);
    }

    if (clarityId) {
      const clarity: Clarity = (...args: unknown[]) => {
        (clarity.q ??= []).push(args);
      };
      analyticsWindow.clarity = clarity;
      clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${clarityId}`;
      document.head.append(script);
    }
  }

  function trackPage(pathname: string): void {
    initialize();
    if (!initialized) return;
    const page = safePagePath(pathname);
    if (lastPage === pathname) return;
    const firstPage = lastPage === null;
    lastPage = pathname;
    if (gaId) {
      (window as AnalyticsWindow).gtag?.(
        "set",
        "page_location",
        `${window.location.origin}${page}`,
      );
      (window as AnalyticsWindow).gtag?.("event", "page_view", {
        page_title: `${config.app} ${page}`,
        page_location: `${window.location.origin}${page}`,
        page_path: page,
        page_referrer: window.location.origin,
      });
    }
    if (firstPage) trackEvent("app_open");
    if (pathname === "/logs/new") trackEvent("record_create_start");
  }

  function trackEvent(event: AnalyticsEvent): void {
    if (!initialized || getConsent() !== "enabled") return;
    (window as AnalyticsWindow).gtag?.("event", event, { app_name: config.app });
    (window as AnalyticsWindow).clarity?.("event", event);
  }

  return { configured, servicesLabel, getConsent, setConsent, initialize, trackPage, trackEvent };
}
