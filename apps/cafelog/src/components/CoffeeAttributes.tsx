import { Flame, Layers3, MapPin, Snowflake, Sprout, ThermometerSun } from "lucide-react";
import type { ComponentType } from "react";

type CoffeeAttributesValue = {
  origin?: string | null;
  region?: string | null;
  variety?: string | null;
  farm?: string | null;
  process?: string | null;
  roast?: string | null;
  isBlend?: boolean | null;
  servingStyle?: string | null;
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
    label: "農園・品種",
    icon: Sprout,
    values: [coffee.farm, coffee.variety].filter((value): value is string => Boolean(value)),
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
      <dl className="mt-2 space-y-1.5" aria-label="コーヒーの属性">
        {groups.map(({ label, icon: Icon, values }) => (
          <div key={label} className="flex min-w-0 items-start gap-2 text-xs">
            <dt className="flex w-5 shrink-0 justify-center pt-0.5 text-cafe-primary/70">
              <Icon aria-hidden="true" size={13} />
              <span className="sr-only">{label}</span>
            </dt>
            <dd className="min-w-0 break-words font-medium leading-relaxed text-cafe-secondary">
              {values.join(" ・ ")}
            </dd>
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
      ],
    },
    {
      title: "豆と製法",
      rows: [
        { label: "品種", value: coffee.variety },
        { label: "精製方法", value: coffee.process },
        { label: "焙煎度", value: coffee.roast },
      ],
    },
  ];

  return (
    <section aria-labelledby="coffee-attributes-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers3 aria-hidden="true" className="text-cafe-primary" size={16} />
        <h4
          id="coffee-attributes-heading"
          className="text-xs font-bold tracking-wide text-cafe-text"
        >
          コーヒーの情報
        </h4>
      </div>
      <div className="space-y-4">
        {sections.map(({ title, rows }) => (
          <div key={title}>
            <h5 className="mb-2 px-1 text-[11px] font-bold tracking-wide text-cafe-secondary">
              {title}
            </h5>
            <dl className="overflow-hidden rounded-xl border border-cafe-secondary/10 bg-cafe-background/35 px-4">
              {rows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex min-w-0 items-start justify-between gap-4 border-b border-cafe-secondary/10 py-3 last:border-b-0"
                >
                  <dt className="shrink-0 text-xs font-medium text-cafe-secondary">{label}</dt>
                  <dd className="min-w-0 break-words text-right text-sm font-semibold text-cafe-text">
                    {value || <span className="font-normal text-cafe-secondary/60">未登録</span>}
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
