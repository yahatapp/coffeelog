import styles from "./store-history.module.css";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "./button";
import { Input } from "./input";
import { StoreLink } from "./store-link";
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
  flavorNotes: string[];
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
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <div className={styles.sortGroup} role="group" aria-label="並び順">
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
              className={styles.sortOption}
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
          className={styles.iconButton}
        >
          {isSearchOpen ? (
            <span className={styles.largeIcon} aria-hidden="true">
              ×
            </span>
          ) : (
            <SearchIcon />
          )}
        </button>
      </div>
      {isSearchOpen && (
        <label className={styles.label}>
          <span className={styles.visuallyHidden}>店舗を検索</span>
          <Input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="店舗名・都道府県"
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
        <ul className={styles.list}>
          {filtered.map((store) => (
            <li key={store.id} className={styles.storePanel}>
              <button
                type="button"
                onClick={() => onSelect(store.id)}
                className={styles.storeButton}
              >
                <span className={styles.storeName}>{store.name}</span>
                <span className={styles.storeMeta}>{store.prefecture || "都道府県未登録"}</span>
              </button>
              {store.links.length > 0 && (
                <ul className={styles.storeLinks}>
                  {store.links.map((url) => (
                    <li key={url}>
                      <StoreLink href={url} />
                    </li>
                  ))}
                </ul>
              )}
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
      className={styles.icon}
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
  return <span className={styles.rating}>{rating == null ? "評価なし" : `★ ${rating}`}</span>;
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
  const returnFocus = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const details = [
    ["豆の種類", record.isBlend == null ? null : record.isBlend ? "ブレンド" : "シングル"],
    ["国", record.origin],
    ["地域", record.region],
    ["品種", record.variety],
    ["農園", record.farm],
    ["生産者", record.producer],
    ["精製", record.process],
    ["焙煎", record.roast],
    ["フレーバー", record.flavorNotes.join("\n")],
    ["金額", record.price == null ? null : `¥${record.price.toLocaleString()}`],
    ["コメント", record.note],
  ] as const;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Viewport className={styles.overlay}>
          <Dialog.Popup className={styles.modal} finalFocus={returnFocus}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.helper}>{dateLabel(record.visitDate)}</p>
                <Dialog.Title className={styles.modalTitle}>飲んだコーヒーの詳細</Dialog.Title>
              </div>
              <Dialog.Close render={<Button variant="ghost" size="icon" />} aria-label="閉じる">
                ×
              </Dialog.Close>
            </div>
            <dl className={styles.details}>
              {details
                .filter(([, value]) => value != null && value !== "")
                .map(([label, value]) => (
                  <div key={label} className={styles.detailRow}>
                    <dt className={styles.muted}>{label}</dt>
                    <dd className={styles.detailValue}>{value}</dd>
                  </div>
                ))}
            </dl>
            {onOpen && (
              <Button type="button" onClick={onOpen} className={styles.open}>
                記録ページを開く
              </Button>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
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
    <div className={styles.sectionStack}>
      <header className={styles.panel}>
        <h2 className={styles.heading}>{store.name}</h2>
        <p className={styles.description}>{store.prefecture || "都道府県未登録"}</p>
        {store.links.length > 0 && (
          <ul className={styles.links}>
            {store.links.map((url) => (
              <li key={url}>
                <StoreLink href={url} />
              </li>
            ))}
          </ul>
        )}
      </header>
      <section aria-labelledby="store-cafe-records" className={styles.list}>
        <h3 id="store-cafe-records" className={styles.rating}>
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
              className={styles.recordButton}
            >
              <div className={styles.toolbar}>
                <h4 className={styles.title}>{dateLabel(record.visitDate)}</h4>
                <Rating rating={record.rating} />
              </div>
              <p className={styles.summary}>
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
      <section aria-labelledby="store-brew-records" className={styles.list}>
        <h3 id="store-brew-records" className={styles.rating}>
          お店の豆で抽出した記録 ({brewRecords.length})
        </h3>
        {brewRecords.length === 0 ? (
          <EmptyState title="抽出記録はまだありません。" />
        ) : (
          brewGroups.map((records) => {
            const bean = records[0];
            return (
              <article key={bean.beanId} className={styles.record}>
                <h4 className={styles.recordTitle}>
                  {bean.beanName}
                  {bean.beanVersion ? ` (${bean.beanVersion})` : ""}
                </h4>
                <p className={styles.helper}>
                  {[
                    bean.roastLevel == null ? null : `焙煎 ${bean.roastLevel}/5`,
                    bean.origin,
                    bean.process,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "豆情報未登録"}
                </p>
                <ul className={styles.divided}>
                  {records.slice(0, 3).map((record) => {
                    const details = (
                      <>
                        <span className={styles.helper}>
                          {dateLabel(record.brewDate)} ·{" "}
                          {record.tempType === "ice" ? "アイス" : "ホット"}
                        </span>
                        <Rating rating={record.rating} />
                      </>
                    );
                    return (
                      <li key={record.id}>
                        {onOpenBrewRecord ? (
                          <button
                            type="button"
                            onClick={() => onOpenBrewRecord(record.id)}
                            className={styles.brewAction}
                          >
                            {details}
                          </button>
                        ) : (
                          <div className={styles.brewSummary}>{details}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {records.length > 3 && (
                  <p className={styles.footnote}>最新3件を表示（全{records.length}件）</p>
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
