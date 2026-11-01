import styles from "./coffee-attributes.module.css";
import { Flame, Layers3, MapPin, Snowflake, Sprout, ThermometerSun } from "lucide-react";
import type { ComponentType } from "react";

type CoffeeAttributesValue = {
  origin?: string | null;
  region?: string | null;
  variety?: string | null;
  farm?: string | null;
  producer?: string | null;
  process?: string | null;
  roast?: string | null;
  isBlend?: boolean | null;
  servingStyle?: string | null;
  flavorNotes?: string[];
};

type AttributeGroup = {
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  values: string[];
};

const getAttributeGroups = (coffee: CoffeeAttributesValue): AttributeGroup[] => [
  {
    label: "産地",
    icon: MapPin,
    values: [coffee.origin, coffee.region].filter((value): value is string => Boolean(value)),
  },
  {
    label: "農園・生産者・品種",
    icon: Sprout,
    values: [coffee.farm, coffee.producer, coffee.variety].filter((value): value is string =>
      Boolean(value),
    ),
  },
  {
    label: "精製・焙煎",
    icon: Flame,
    values: [coffee.process, coffee.roast].filter((value): value is string => Boolean(value)),
  },
  {
    label: "一杯のスタイル",
    icon: coffee.servingStyle === "iced" ? Snowflake : ThermometerSun,
    values: [
      coffee.isBlend == null ? null : coffee.isBlend ? "ブレンド" : "シングルオリジン",
      coffee.servingStyle === "hot" ? "ホット" : coffee.servingStyle === "iced" ? "アイス" : null,
    ].filter((value): value is string => Boolean(value)),
  },
];

export const CoffeeAttributes = ({
  coffee,
  compact = false,
}: {
  coffee: CoffeeAttributesValue;
  compact?: boolean;
}) => {
  const groups = getAttributeGroups(coffee).filter(({ values }) => values.length > 0);

  if (compact && groups.length === 0) return null;

  if (compact) {
    return (
      <dl className={styles.compact} aria-label="コーヒーの属性">
        {groups.map(({ label, icon: Icon, values }) => (
          <div key={label} className={styles.compactRow}>
            <dt className={styles.compactLabel}>
              <Icon aria-hidden="true" size={13} />
              <span className={styles.visuallyHidden}>{label}</span>
            </dt>
            <dd className={styles.compactValue}>{values.join(" ・ ")}</dd>
          </div>
        ))}
      </dl>
    );
  }

  const sections = [
    {
      title: "産地",
      rows: [
        { label: "国", value: coffee.origin },
        { label: "産地", value: coffee.region },
        { label: "農園", value: coffee.farm },
        { label: "生産者", value: coffee.producer },
      ],
    },
    {
      title: "豆と製法",
      rows: [
        { label: "品種", value: coffee.variety },
        { label: "精製方法", value: coffee.process },
        { label: "焙煎度", value: coffee.roast },
        {
          label: "フレーバーノート",
          value: coffee.flavorNotes?.join("\n"),
        },
      ],
    },
  ];

  return (
    <section aria-labelledby="coffee-attributes-heading" className={styles.stack}>
      <div className={styles.header}>
        <Layers3 aria-hidden="true" className={styles.accent} size={16} />
        <h4 id="coffee-attributes-heading" className={styles.heading}>
          コーヒーの情報
        </h4>
      </div>
      <div className={styles.stack}>
        {sections.map(({ title, rows }) => (
          <div key={title}>
            <h5 className={styles.sectionTitle}>{title}</h5>
            <dl className={styles.details}>
              {rows.map(({ label, value }) => (
                <div key={label} className={styles.row}>
                  <dt className={styles.label}>{label}</dt>
                  <dd className={styles.value}>
                    {value || <span className={styles.muted}>未登録</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
};
