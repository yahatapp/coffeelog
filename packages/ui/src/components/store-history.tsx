import { useEffect, useMemo, useRef, useState } from "react";
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
  beanId: string;
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sort, setSort] = useState<"name" | "prefecture">("name");
  const searchRef = useRef<HTMLInputElement>(null);
  const prefectures = [
    "北海道",
    "青森県",
    "岩手県",
    "宮城県",
    "秋田県",
    "山形県",
    "福島県",
    "茨城県",
    "栃木県",
    "群馬県",
    "埼玉県",
    "千葉県",
    "東京都",
    "神奈川県",
    "新潟県",
    "富山県",
    "石川県",
    "福井県",
    "山梨県",
    "長野県",
    "岐阜県",
    "静岡県",
    "愛知県",
    "三重県",
    "滋賀県",
    "京都府",
    "大阪府",
    "兵庫県",
    "奈良県",
    "和歌山県",
    "鳥取県",
    "島根県",
    "岡山県",
    "広島県",
    "山口県",
    "徳島県",
    "香川県",
    "愛媛県",
    "高知県",
    "福岡県",
    "佐賀県",
    "長崎県",
    "熊本県",
    "大分県",
    "宮崎県",
    "鹿児島県",
    "沖縄県",
  ];
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return stores
      .filter((store) =>
        `${store.name} ${store.prefecture ?? ""}`.toLocaleLowerCase().includes(query),
      )
      .toSorted((left, right) => {
        if (sort === "prefecture") {
          const leftIndex = left.prefecture ? prefectures.indexOf(left.prefecture) : Infinity;
          const rightIndex = right.prefecture ? prefectures.indexOf(right.prefecture) : Infinity;
          if (leftIndex !== rightIndex) return leftIndex - rightIndex;
        }
        return left.name.localeCompare(right.name, "ja");
      });
  }, [search, sort, stores]);

  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus();
  }, [isSearchOpen]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full bg-primary/10 p-1" aria-label="並び順">
          {(
            [
              ["name", "名前順"],
              ["prefecture", "都道府県順"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={`min-h-10 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sort === value ? "bg-surface text-primary shadow-sm" : "text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={isSearchOpen ? "検索を閉じる" : "店舗を検索"}
          aria-expanded={isSearchOpen}
          onClick={() => {
            setIsSearchOpen((open) => !open);
            if (isSearchOpen) setSearch("");
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isSearchOpen ? (
            <span className="text-2xl leading-none" aria-hidden="true">
              ×
            </span>
          ) : (
            <SearchIcon />
          )}
        </button>
      </div>
      {isSearchOpen && (
        <label className="block text-sm font-semibold text-foreground">
          <span className="sr-only">店舗を検索</span>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="店舗名・都道府県"
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      )}
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

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

const dateLabel = (date: string | null) => date?.replaceAll("-", ".") || "日付未登録";

function Rating({ rating }: { rating: number | null }) {
  return (
    <span className="font-bold text-primary">{rating == null ? "評価なし" : `★ ${rating}`}</span>
  );
}

function CafeRecordModal({
  record,
  onClose,
  onOpen,
}: {
  record: CafeRecord;
  onClose: () => void;
  onOpen?: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const details = [
    ["豆の種類", record.isBlend == null ? null : record.isBlend ? "ブレンド" : "シングル"],
    ["国", record.origin],
    ["地域", record.region],
    ["品種", record.variety],
    ["農園", record.farm],
    ["生産者", record.producer],
    ["精製", record.process],
    ["焙煎", record.roast],
    ["フレーバー", record.flavorNote],
    ["金額", record.price == null ? null : `¥${record.price.toLocaleString()}`],
    ["コメント", record.note],
  ] as const;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cafe-record-title"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{dateLabel(record.visitDate)}</p>
            <h4 id="cafe-record-title" className="mt-1 text-lg font-bold text-primary">
              飲んだコーヒーの詳細
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex size-11 items-center justify-center rounded-full text-2xl text-muted hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ×
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
          {details
            .filter(([, value]) => value != null && value !== "")
            .map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd className="whitespace-pre-wrap break-words text-foreground">{value}</dd>
              </div>
            ))}
        </dl>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="mt-5 min-h-11 w-full rounded-full bg-primary px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            記録ページを開く
          </button>
        )}
      </section>
    </div>
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
  const [selectedCafeRecord, setSelectedCafeRecord] = useState<CafeRecord | null>(null);
  const brewGroups = useMemo(() => {
    const groups = new Map<string, BrewRecord[]>();
    for (const record of brewRecords) {
      const records = groups.get(record.beanId) ?? [];
      records.push(record);
      groups.set(record.beanId, records);
    }
    return [...groups.values()];
  }, [brewRecords]);
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
            <button
              type="button"
              onClick={() => setSelectedCafeRecord(record)}
              key={record.id}
              className="block w-full space-y-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-foreground">{dateLabel(record.visitDate)}</h4>
                <Rating rating={record.rating} />
              </div>
              <p className="text-sm text-muted">
                {record.servingStyle === "iced"
                  ? "アイス"
                  : record.servingStyle === "hot"
                    ? "ホット"
                    : "提供方法未登録"}
                {[record.origin, record.farm, record.process].filter(Boolean).length > 0 &&
                  ` · ${[record.origin, record.farm, record.process].filter(Boolean).join(" / ")}`}
              </p>
            </button>
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
          brewGroups.map((records) => {
            const bean = records[0];
            return (
              <article
                key={bean.beanId}
                className="space-y-3 rounded-2xl border border-border bg-surface p-4"
              >
                <h4 className="break-words font-semibold text-foreground">
                  {bean.beanName}
                  {bean.beanVersion ? ` (${bean.beanVersion})` : ""}
                </h4>
                <p className="text-xs text-muted">
                  {[
                    bean.roastLevel == null ? null : `焙煎 ${bean.roastLevel}/5`,
                    bean.origin,
                    bean.process,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "豆情報未登録"}
                </p>
                <ul className="divide-y divide-border">
                  {records.slice(0, 3).map((record) => (
                    <li key={record.id}>
                      <button
                        type="button"
                        onClick={onOpenBrewRecord ? () => onOpenBrewRecord(record.id) : undefined}
                        className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="text-xs text-muted">
                          {dateLabel(record.brewDate)} ·{" "}
                          {record.tempType === "ice" ? "アイス" : "ホット"}
                        </span>
                        <Rating rating={record.rating} />
                      </button>
                    </li>
                  ))}
                </ul>
                {records.length > 3 && (
                  <p className="text-right text-xs text-muted">
                    最新3件を表示（全{records.length}件）
                  </p>
                )}
              </article>
            );
          })
        )}
      </section>
      {selectedCafeRecord && (
        <CafeRecordModal
          record={selectedCafeRecord}
          onClose={() => setSelectedCafeRecord(null)}
          onOpen={onOpenCafeRecord ? () => onOpenCafeRecord(selectedCafeRecord.id) : undefined}
        />
      )}
    </div>
  );
}
