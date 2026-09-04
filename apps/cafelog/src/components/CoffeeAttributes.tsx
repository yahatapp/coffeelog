import { Bean, Flame, Layers3, MapPin, Snowflake, Sprout, ThermometerSun } from "lucide-react";
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

  if (groups.length === 0) {
    return compact ? null : (
      <div className="flex items-center gap-2 rounded-xl bg-cafe-background/60 px-3 py-3 text-xs text-cafe-secondary">
        <Bean aria-hidden="true" size={15} />
        <span>豆の情報は登録されていません</span>
      </div>
    );
  }

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

  return (
    <section aria-labelledby="coffee-attributes-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers3 aria-hidden="true" className="text-cafe-primary" size={16} />
        <h4
          id="coffee-attributes-heading"
          className="text-xs font-bold tracking-wide text-cafe-text"
        >
          コーヒーの情報
        </h4>
      </div>
      <dl className="divide-y divide-cafe-secondary/10 overflow-hidden rounded-xl border border-cafe-secondary/10 bg-cafe-background/35">
        {groups.map(({ label, icon: Icon, values }) => (
          <div key={label} className="grid grid-cols-[7rem_1fr] items-start gap-3 px-4 py-3">
            <dt className="flex items-center gap-2 text-[11px] font-bold text-cafe-secondary">
              <Icon aria-hidden="true" className="text-cafe-primary" size={14} />
              {label}
            </dt>
            <dd className="flex flex-wrap justify-end gap-1.5 text-right">
              {values.map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-cafe-secondary/15 bg-white px-2.5 py-1 text-xs font-semibold leading-none text-cafe-text shadow-xs"
                >
                  {value}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
