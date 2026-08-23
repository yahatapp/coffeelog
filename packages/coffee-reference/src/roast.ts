export const ROAST_LEVELS = [
  { level: 1, label: "浅煎り" },
  { level: 2, label: "中浅煎り" },
  { level: 3, label: "中煎り" },
  { level: 4, label: "中深煎り" },
  { level: 5, label: "深煎り" },
] as const;

export type RoastLevel = (typeof ROAST_LEVELS)[number]["level"];

export function getRoastLabel(level: number | null | undefined): string {
  if (!level) return "";
  return ROAST_LEVELS.find((option) => option.level === level)?.label ?? "不明";
}
