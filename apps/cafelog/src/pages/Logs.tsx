import styles from "./content.module.css";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Button,
  Loading,
  ErrorState,
  EmptyState,
  LogListControls,
  type LogSortOrder,
  type LogTemperatureFilter,
} from "@yahatapp/ui";
import { getErrorMessage } from "@/lib/errors";
import { cafelogQueries } from "@/lib/queries";
import { ClipboardList, Plus } from "lucide-react";
import { CafeLogListCard } from "@/components/CafeLogListCard";
import { analytics } from "@/lib/analytics";

const LogsPage = () => {
  const { data: logs = [], isPending: isLoading, error, refetch } = useQuery(cafelogQueries.logs());
  const errorMessage = error ? getErrorMessage(error, "通信エラーが発生しました。") : null;
  const [filter, setFilter] = useState<LogTemperatureFilter>("all");
  const [sortBy, setSortBy] = useState<"date" | "prefecture" | "rating">("date");
  const [sortOrder, setSortOrder] = useState<LogSortOrder>("desc");

  const changeSort = (nextSort: "date" | "prefecture" | "rating") => {
    analytics.trackEvent("sort_change");
    if (sortBy === nextSort) {
      setSortOrder((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }
    setSortBy(nextSort);
    setSortOrder(nextSort === "prefecture" ? "asc" : "desc");
  };

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

  if (isLoading) return <Loading label="記録を読み込み中..." />;
  if (errorMessage)
    return <ErrorState message="記録一覧を取得できませんでした。" onRetry={() => void refetch()} />;
  return (
    <div className={styles.listPage}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <ClipboardList size={24} aria-hidden="true" />
          <h2 className={styles.heading}>記録一覧</h2>
        </div>
        <Button asChild variant="secondary">
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
          sortOptions={[
            { value: "date", label: "日付", initialOrder: "desc" },
            { value: "prefecture", label: "都道府県", initialOrder: "asc" },
            { value: "rating", label: "評価", initialOrder: "desc" },
          ]}
          onSortChange={changeSort}
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
          {sortedLogs.map((log) => (
            <Link
              key={log.id}
              to={`/logs/${log.id}`}
              className={styles.recordLink}
              aria-label={`${log.cafeName}の記録（${log.visitDate ?? "日付未登録"}）`}
            >
              <CafeLogListCard log={log} />
            </Link>
          ))}
        </div>
      )}
      {logs.length > 0 && (
        <Link to="/logs/new" className={styles.floatingAction} aria-label="新規追加">
          <Plus size={24} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
};
export default LogsPage;
