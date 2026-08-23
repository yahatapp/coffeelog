export type ProcessMethodId =
  | "washed"
  | "natural"
  | "honey"
  | "pulped-natural"
  | "anaerobic"
  | "wet-hulled"
  | "other";

export interface ProcessMethodDefinition {
  readonly id: ProcessMethodId;
  readonly label: string;
  /** Existing Japanese DB values and user-facing variants for this method. */
  readonly variants: readonly string[];
}

export const PROCESS_METHODS = [
  { id: "washed", label: "ウォッシュド", variants: ["ウォッシュド"] },
  { id: "natural", label: "ナチュラル", variants: ["ナチュラル"] },
  {
    id: "honey",
    label: "ハニー",
    variants: ["ハニー", "ホワイトハニー", "イエローハニー", "レッドハニー", "ブラックハニー"],
  },
  { id: "pulped-natural", label: "パルプドナチュラル", variants: ["パルプドナチュラル"] },
  { id: "anaerobic", label: "アナエロビック", variants: ["アナエロビック", "アナエロビック (嫌気性発酵)"] },
  { id: "wet-hulled", label: "スマトラ式", variants: ["スマトラ式"] },
  { id: "other", label: "その他", variants: ["その他"] },
] as const satisfies readonly ProcessMethodDefinition[];

/** The more detailed choices historically exposed by Brewlog. */
export const BREWLOG_PROCESS_METHODS = [
  { value: "ナチュラル", label: "ナチュラル" },
  { value: "ウォッシュド", label: "ウォッシュド" },
  { value: "ホワイトハニー", label: "ホワイトハニー" },
  { value: "イエローハニー", label: "イエローハニー" },
  { value: "レッドハニー", label: "レッドハニー" },
  { value: "ブラックハニー", label: "ブラックハニー" },
  { value: "パルプドナチュラル", label: "パルプドナチュラル" },
  { value: "スマトラ式", label: "スマトラ式" },
  { value: "アナエロビック", label: "アナエロビック (嫌気性発酵)" },
  { value: "その他", label: "その他" },
] as const;

/** The compact choices historically exposed by Cafelog. */
export const CAFELOG_PROCESS_METHODS = [
  "ウォッシュド",
  "ナチュラル",
  "ハニー",
  "パルプドナチュラル",
  "アナエロビック",
] as const;

export interface NormalizedProcessMethod {
  readonly id: ProcessMethodId;
  readonly label: string;
  /** Original value, retained so callers can preserve free-form DB data. */
  readonly raw: string;
}

const normalizeText = (value: string) => value.trim().toLocaleLowerCase("ja-JP");

/** Classify a stored/free-form process value without changing the stored value. */
export function normalizeProcessMethod(
  value: string | null | undefined,
): NormalizedProcessMethod | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const normalized = normalizeText(raw);

  const known = PROCESS_METHODS.find((method) =>
    method.variants.some((variant) => normalizeText(variant) === normalized),
  );

  return {
    id: known?.id ?? "other",
    label: known?.label ?? "その他",
    raw,
  };
}

export function getProcessMethodLabel(value: string | null | undefined): string {
  return normalizeProcessMethod(value)?.label ?? "";
}
