export interface CountryOption {
  readonly code: string;
  readonly name: string;
  readonly keywords: readonly string[];
}

/** Coffee-producing countries used by origin autocomplete and flag rendering. */
export const COFFEE_COUNTRIES = [
  { code: "et", name: "エチオピア", keywords: ["エチオピア", "ethiopia", "イルガチェフェ", "シダモ"] },
  { code: "co", name: "コロンビア", keywords: ["コロンビア", "colombia", "スプレモ"] },
  { code: "br", name: "ブラジル", keywords: ["ブラジル", "brazil", "サントス"] },
  { code: "gt", name: "グアテマラ", keywords: ["グアテマラ", "guatemala", "ガテマラ"] },
  { code: "id", name: "インドネシア", keywords: ["インドネシア", "indonesia", "マンデリン", "トラジャ", "コピ"] },
  { code: "ke", name: "ケニア", keywords: ["ケニア", "kenya"] },
  { code: "tz", name: "タンザニア", keywords: ["タンザニア", "tanzania", "キリマンジャロ"] },
  { code: "cr", name: "コスタリカ", keywords: ["コスタリカ", "costa rica", "costarica"] },
  { code: "sv", name: "エルサルバドル", keywords: ["エルサルバドル", "el salvador", "elsalvador"] },
  { code: "hn", name: "ホンジュラス", keywords: ["ホンジュラス", "honduras"] },
  { code: "pa", name: "パナマ", keywords: ["パナマ", "panama"] },
  { code: "rw", name: "ルワンダ", keywords: ["ルワンダ", "rwanda"] },
  { code: "ye", name: "イエメン", keywords: ["イエメン", "yemen", "マタリ"] },
  { code: "vn", name: "ベトナム", keywords: ["ベトナム", "vietnam"] },
  { code: "tl", name: "東ティモール", keywords: ["東ティモール", "timor-leste", "timor leste", "east timor"] },
  { code: "pg", name: "パプアニューギニア", keywords: ["パプア", "papua", "new guinea"] },
  { code: "jm", name: "ジャマイカ", keywords: ["ジャマイカ", "jamaica", "ブルーマウンテン", "ブルマン"] },
  { code: "us", name: "アメリカ (ハワイ)", keywords: ["ハワイ", "hawaii", "コナ", "kona"] },
  { code: "mx", name: "メキシコ", keywords: ["メキシコ", "mexico"] },
  { code: "pe", name: "ペルー", keywords: ["ペルー", "peru"] },
  { code: "ni", name: "ニカラグア", keywords: ["ニカラグア", "nicaragua"] },
  { code: "bo", name: "ボリビア", keywords: ["ボリビア", "bolivia"] },
  { code: "ec", name: "エクアドル", keywords: ["エクアドル", "ecuador"] },
  { code: "in", name: "インド", keywords: ["インド", "india"] },
  { code: "cn", name: "中国", keywords: ["中国", "china", "雲南", "ユンナン"] },
  { code: "th", name: "タイ", keywords: ["タイ", "thailand"] },
  { code: "mm", name: "ミャンマー", keywords: ["ミャンマー", "myanmar"] },
  { code: "jp", name: "日本", keywords: ["日本", "japan", "沖縄"] },
] as const satisfies readonly CountryOption[];

/** Return the flag-country code for a free-form origin value. */
export function getCountryCode(origin: string | null | undefined): string | null {
  if (!origin) return null;
  const normalized = origin.toLowerCase().trim();

  for (const country of COFFEE_COUNTRIES) {
    if (country.keywords.some((keyword) => normalized.includes(keyword))) {
      return country.code;
    }
  }

  return null;
}
