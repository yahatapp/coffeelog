export const FREQUENT_PREFECTURES = ["東京都", "愛知県", "大阪府", "京都府", "山口県"] as const;

export const PREFECTURE_GROUPS = [
  {
    label: "北海道・東北",
    prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  },
  { label: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "神奈川県"] },
  {
    label: "中部",
    prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県"],
  },
  { label: "近畿", prefectures: ["三重県", "滋賀県", "兵庫県", "奈良県", "和歌山県"] },
  {
    label: "中国・四国",
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "徳島県", "香川県", "愛媛県", "高知県"],
  },
  {
    label: "九州・沖縄",
    prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  },
] as const;

export const PREFECTURES = [
  ...FREQUENT_PREFECTURES,
  ...PREFECTURE_GROUPS.flatMap(({ prefectures }) => prefectures),
] as const;
