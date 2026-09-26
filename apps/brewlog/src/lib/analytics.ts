import { createAnalytics } from "@yahatapp/analytics";

export const analytics = createAnalytics({
  app: "brewlog",
  gaId: import.meta.env.VITE_GA4_MEASUREMENT_ID,
  clarityId: import.meta.env.VITE_CLARITY_PROJECT_ID,
  production: import.meta.env.PROD,
});
