export const BREWLOG_SERVING_STYLES = [
  { value: "hot", label: "ホット" },
  { value: "ice", label: "アイス" },
] as const;

export const CAFELOG_SERVING_STYLES = [
  { value: "hot", label: "ホット" },
  { value: "iced", label: "アイス" },
] as const;

export function getServingStyleLabel(value: string | null | undefined): string {
  if (value === "hot") return "ホット";
  if (value === "ice" || value === "iced") return "アイス";
  return "";
}
