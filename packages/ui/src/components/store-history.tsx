import { useState } from "react";
import { EmptyState } from "./status";

export type StoreInfo = {
  id: string;
  name: string;
  prefecture: string | null;
  links: string[];
};

type CoffeeRecord = {
  id: string;
  origin: string | null;
  process: string | null;
  rating: number | null;
  note: string | null;
};

type CafeRecord = CoffeeRecord & {
  isBlend: boolean | null;
  visitDate: string | null;
  region: string | null;
  variety: string | null;
  farm: string | null;
  producer: string | null;
  roast: string | null;
  flavorNote: string | null;
  servingStyle: string | null;
  price: number | null;
};

type BrewRecord = CoffeeRecord & {
  region: string | null;
  variety: string | null;
  farm: string | null;
  producer: string | null;
  beanName: string;
  beanVersion: string | null;
  brewDate: string | null;
  method: string | null;
  tempType: string;
  roastLevel: number | null;
  grindSize: number | null;
  waterTemp: number | null;
  beanAmount: number | null;
  waterAmount: number | null;
};

export function StoreList({
  stores,
  onSelect,
}: {
  stores: readonly StoreInfo[];
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = stores.filter((store) =>
    `${store.name} ${store.prefecture ?? ""}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-foreground">
        店舗を検索
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="店舗名・都道府県"
          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      {filtered.length === 0 ? (
        <EmptyState
          title={stores.length ? "店舗が見つかりません。" : "店舗はまだ登録されていません。"}
          description={
            stores.length
              ? "検索条件を変更してください。"
              : "来店記録やスペシャルティの豆登録から店舗を登録できます。"
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((store) => (
            <li key={store.id}>
              <button
                type="button"
                onClick={() => onSelect(store.id)}
                className="min-h-16 w-full rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block break-words font-bold text-primary">{store.name}</span>
                <span className="mt-1 block text-xs text-muted">
                  {store.prefecture || "都道府県未登録"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const dateLabel = (date: string | null) => date?.replaceAll("-", ".") || "日付未登録";

function RecordFooter({ record, onOpen }: { record: CoffeeRecord; onOpen?: () => void }) {
  return (
    <>
      <p className="text-sm font-bold text-primary">
        {record.rating == null ? "評価なし" : `評価 ${record.rating} / 5`}
      </p>
      {record.note && (
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
          {record.note}
        </p>
      )}
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="min-h-11 rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          記録の詳細
        </button>
      )}
    </>
  );
}

export function StoreHistory({
  store,
  cafeRecords,
  brewRecords,
  onOpenCafeRecord,
  onOpenBrewRecord,
}: {
  store: StoreInfo;
  cafeRecords: readonly CafeRecord[];
  brewRecords: readonly BrewRecord[];
  onOpenCafeRecord?: (id: string) => void;
  onOpenBrewRecord?: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="break-words text-xl font-bold text-primary">{store.name}</h2>
        <p className="mt-2 text-sm text-muted">{store.prefecture || "都道府県未登録"}</p>
        {store.links.length > 0 && (
          <ul className="mt-3 space-y-2">
            {store.links.map((url, index) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block min-h-11 break-all py-2 text-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  お店のリンク {index + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>
      <section aria-labelledby="store-cafe-records" className="space-y-3">
        <h3 id="store-cafe-records" className="font-bold text-primary">
          店で飲んだコーヒー ({cafeRecords.length})
        </h3>
        {cafeRecords.length === 0 ? (
          <EmptyState title="来店記録はまだありません。" />
        ) : (
          cafeRecords.map((record) => (
            <article
              key={record.id}
              className="space-y-3 rounded-2xl border border-border bg-surface p-5"
            >
              <h4 className="font-semibold text-foreground">
                {dateLabel(record.visitDate)} ·{" "}
                {record.servingStyle === "iced"
                  ? "アイス"
                  : record.servingStyle === "hot"
                    ? "ホット"
                    : "提供方法未登録"}
              </h4>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                {(
                  [
                    [
                      "豆の種類",
                      record.isBlend == null ? null : record.isBlend ? "ブレンド" : "シングル",
                    ],
                    ["産地", record.origin],
                    ["地域", record.region],
                    ["品種", record.variety],
                    ["農園", record.farm],
                    ["生産者", record.producer],
                    ["精製方法", record.process],
                    ["焙煎度", record.roast],
                    ["フレーバー", record.flavorNote],
                    ["金額", record.price == null ? null : `¥${record.price.toLocaleString()}`],
                  ] as const
                )
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-muted">{label}</dt>
                      <dd className="break-words text-foreground">{value}</dd>
                    </div>
                  ))}
              </dl>
              <RecordFooter
                record={record}
                onOpen={onOpenCafeRecord ? () => onOpenCafeRecord(record.id) : undefined}
              />
            </article>
          ))
        )}
      </section>
      <section aria-labelledby="store-brew-records" className="space-y-3">
        <h3 id="store-brew-records" className="font-bold text-primary">
          お店の豆で抽出した記録 ({brewRecords.length})
        </h3>
        {brewRecords.length === 0 ? (
          <EmptyState title="抽出記録はまだありません。" />
        ) : (
          brewRecords.map((record) => (
            <article
              key={record.id}
              className="space-y-3 rounded-2xl border border-border bg-surface p-5"
            >
              <h4 className="break-words font-semibold text-foreground">
                {record.beanName}
                {record.beanVersion ? ` (${record.beanVersion})` : ""}
              </h4>
              <p className="text-xs text-muted">
                {dateLabel(record.brewDate)} · {record.tempType === "ice" ? "アイス" : "ホット"}
              </p>
              <p className="break-words text-sm text-foreground">
                {[
                  record.origin,
                  record.region,
                  record.variety,
                  record.farm,
                  record.producer,
                  record.process,
                  record.method,
                ]
                  .filter(Boolean)
                  .join(" / ") || "豆の属性未登録"}
              </p>
              <p className="text-sm text-foreground">
                {[
                  record.roastLevel == null ? null : `焙煎度 ${record.roastLevel}/5`,
                  record.beanAmount == null ? null : `粉 ${record.beanAmount}g`,
                  record.waterAmount == null ? null : `湯 ${record.waterAmount}ml`,
                  record.waterTemp == null ? null : `${record.waterTemp}℃`,
                  record.grindSize == null ? null : `${record.grindSize}クリック`,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              <RecordFooter
                record={record}
                onOpen={onOpenBrewRecord ? () => onOpenBrewRecord(record.id) : undefined}
              />
            </article>
          ))
        )}
      </section>
    </div>
  );
}
