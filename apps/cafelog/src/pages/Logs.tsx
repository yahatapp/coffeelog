import { useListSearchParams, PageHeading, PageStatus } from "@yahatapp/ui";
import styles from "./content.module.css";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Button,
  Loading,
  ErrorState,
  EmptyState,
  LogListControls,
  formatDisplayDate,
} from "@yahatapp/ui";
import { cafelogQueries, type LogsResponse } from "@/lib/queries";
import { ClipboardList, Plus } from "lucide-react";
import { CafeLogListCard } from "@/components/CafeLogListCard";
import { analytics } from "@/lib/analytics";

const sortOptions = [
  { value: "date", label: "訪問日", initialOrder: "desc" },
  { value: "prefecture", label: "都道府県", initialOrder: "asc" },
  { value: "rating", label: "評価", initialOrder: "desc" },
] as const;
function cardLabel(log: LogsResponse[number]) {
  const date = log.visitDate
    ? formatDisplayDate(log.visitDate)
    : `登録日 ${formatDisplayDate(log.createdAt)}`;
  return [
    `${log.cafeName}の記録（${date}）`,
    log.origin,
    log.variety,
    log.process,
    log.roast,
    log.isBlend == null ? null : log.isBlend ? "ブレンド" : "シングル",
    log.servingStyle === "hot" ? "ホット" : log.servingStyle === "iced" ? "アイス" : null,
    log.rating == null ? null : `評価 ${log.rating}`,
  ]
    .filter(Boolean)
    .join("、");
}

const LogsPage = () => {
  const { data: logs = [], isPending: isLoading, error, refetch } = useQuery(cafelogQueries.logs());
  const { filter, setFilter, sortBy, sortOrder, changeSort } = useListSearchParams(sortOptions);
  const filteredLogs = logs.filter((log) => filter === "all" || log.servingStyle === filter);
  const sortedLogs = filteredLogs.toSorted((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.visitDate ?? a.createdAt).getTime();
      const dateB = new Date(b.visitDate ?? b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    }

    if (sortBy === "prefecture") {
      if (!a.prefecture && !b.prefecture) return 0;
      if (!a.prefecture) return 1;
      if (!b.prefecture) return -1;
      const comparison = a.prefecture.localeCompare(b.prefecture, "ja");
      return sortOrder === "desc" ? -comparison : comparison;
    }

    if (a.rating == null && b.rating == null) return 0;
    if (a.rating == null) return 1;
    if (b.rating == null) return -1;
    return sortOrder === "desc" ? b.rating - a.rating : a.rating - b.rating;
  });

  const cardLabels = sortedLogs.map(cardLabel);
  const totals = new Map<string, number>();
  const occurrences = new Map<string, number>();
  for (const label of cardLabels) totals.set(label, (totals.get(label) ?? 0) + 1);
  const distinctLabels = cardLabels.map((label) => {
    if (totals.get(label) === 1) return label;
    const position = (occurrences.get(label) ?? 0) + 1;
    occurrences.set(label, position);
    return `${label}、${position}件目`;
  });

  if (isLoading)
    return (
      <PageStatus>
        <Loading label="記録を読み込み中..." />
      </PageStatus>
    );
  if (error)
    return (
      <PageStatus>
        <ErrorState message="記録一覧を取得できませんでした。" onRetry={() => void refetch()} />
      </PageStatus>
    );
  return (
    <div className={styles.listPage}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <ClipboardList size={24} aria-hidden="true" />
          <PageHeading className={styles.heading}>記録一覧</PageHeading>
        </div>
        <Button asChild variant="primary-container">
          <Link to="/logs/new">
            <Plus size={18} aria-hidden="true" />
            追加
          </Link>
        </Button>
      </header>
      {logs.length > 0 && (
        <LogListControls
          filter={filter}
          counts={{
            all: logs.length,
            hot: logs.filter((log) => log.servingStyle === "hot").length,
            iced: logs.filter((log) => log.servingStyle === "iced").length,
          }}
          onFilterChange={(next) => {
            analytics.trackEvent("filter_change");
            setFilter(next);
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          sortOptions={sortOptions}
          onSortChange={(value) => {
            analytics.trackEvent("sort_change");
            changeSort(value);
          }}
        />
      )}
      {logs.length === 0 ? (
        <EmptyState
          title="まだ記録がありません"
          description="カフェで飲んだ一杯やお店の雰囲気を記録しましょう。"
          action={
            <Button asChild>
              <Link to="/logs/new">
                <Plus size={18} aria-hidden="true" />
                最初の記録を追加
              </Link>
            </Button>
          }
        />
      ) : filteredLogs.length === 0 ? (
        <EmptyState title={`${filter === "hot" ? "ホット" : "アイス"}の記録はまだありません。`} />
      ) : (
        <div className={styles.section}>
          {sortedLogs.map((log, index) => (
            <Link
              key={log.id}
              data-return-card={log.id}
              to={`/logs/${log.id}`}
              className={styles.recordLink}
              aria-label={distinctLabels[index]}
            >
              <CafeLogListCard log={log} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default LogsPage;
