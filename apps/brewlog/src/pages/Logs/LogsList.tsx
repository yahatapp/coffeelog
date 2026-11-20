import { useListSearchParams, PageHeading, PageStatus } from "@yahatapp/ui";
import { Loading, ErrorState, EmptyState, LogListControls, formatDisplayDate } from "@yahatapp/ui";
import styles from "../content.module.css";
import listStyles from "./logs-list.module.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Star, Calendar } from "lucide-react";
import { logQueries, type BrewLog } from "@/lib/queries";
import { analytics } from "@/lib/analytics";
import { OriginFlag } from "@/components/ui/OriginFlag";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
const sortOptions = [
  { value: "date", label: "抽出日", initialOrder: "desc" },
  { value: "bean", label: "豆", initialOrder: "asc" },
  { value: "rating", label: "評価", initialOrder: "desc" },
] as const;
const LogsList = () => {
  const navigate = useNavigate();
  const logsQuery = useQuery(logQueries.all());
  const logs: BrewLog[] = logsQuery.data ?? [];
  const { filter, setFilter, sortBy, sortOrder, changeSort } = useListSearchParams(sortOptions);
  const hotLogsCount = logs.filter((log) => log.tempType !== "ice").length;
  const iceLogsCount = logs.filter((log) => log.tempType === "ice").length;
  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    if (filter === "hot") return log.tempType !== "ice";
    if (filter === "iced") return log.tempType === "ice";
    return true;
  });
  const getLogTimestamp = (log: BrewLog): number => {
    if (log.brewDate) {
      const [year, month, day] = log.brewDate.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    }
    return new Date(log.createdAt).getTime();
  };
  const sortedLogs = [...filteredLogs].toSorted((a, b) => {
    if (sortBy === "date") {
      const dateA = getLogTimestamp(a);
      const dateB = getLogTimestamp(b);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    }
    if (sortBy === "bean") {
      const nameA = a.bean.name;
      const nameB = b.bean.name;
      const nameCompare =
        sortOrder === "desc" ? nameB.localeCompare(nameA, "ja") : nameA.localeCompare(nameB, "ja");
      if (nameCompare !== 0) return nameCompare;

      // セカンドソート: 日付 (降順)
      const dateA = getLogTimestamp(a);
      const dateB = getLogTimestamp(b);
      return dateB - dateA;
    }
    if (sortBy === "rating") {
      const ratingA = a.rating;
      const ratingB = b.rating;
      if (ratingA === null && ratingB === null) {
        const dateA = getLogTimestamp(a);
        const dateB = getLogTimestamp(b);
        return dateB - dateA;
      }
      if (ratingA === null) return 1;
      if (ratingB === null) return -1;
      const ratingCompare = sortOrder === "desc" ? ratingB - ratingA : ratingA - ratingB;
      if (ratingCompare !== 0) return ratingCompare;

      // セカンドソート: 日付 (降順)
      const dateA = getLogTimestamp(a);
      const dateB = getLogTimestamp(b);
      return dateB - dateA;
    }
    return 0;
  });
  if (logsQuery.isPending) {
    return (
      <PageStatus>
        <Loading className={styles.state} />
      </PageStatus>
    );
  }
  if (logsQuery.isError) {
    return (
      <PageStatus>
        <div className={[styles.roomy, styles.center, styles.muted].join(" ")}>
          <ErrorState
            message={<>抽出履歴の取得に失敗しました。</>}
            onRetry={() => void logsQuery.refetch()}
          />
        </div>
      </PageStatus>
    );
  }
  return (
    <div className={styles.stack}>
      <div className={[styles.row, styles.spread].join(" ")}>
        <PageHeading className={[styles.heading, styles.strong, styles.accent].join(" ")}>
          抽出履歴
        </PageHeading>
        <Button size="sm" variant="outline" onClick={() => navigate("/logs/new")} type="button">
          <Plus size={16} /> 追加
        </Button>
      </div>

      {logs.length > 0 && (
        <LogListControls
          filter={filter}
          counts={{ all: logs.length, hot: hotLogsCount, iced: iceLogsCount }}
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

      {filteredLogs.length === 0 ? (
        <EmptyState
          title={
            <>
              {filter === "all"
                ? "記録はまだありません。"
                : filter === "hot"
                  ? "ホットコーヒーの記録はまだありません。"
                  : "アイスコーヒーの記録はまだありません。"}
            </>
          }
          description={<>最高の一杯を記録しましょう！</>}
          action={
            <Button onClick={() => navigate("/logs/new")} type="button">
              抽出を記録する
            </Button>
          }
        />
      ) : (
        <div className={styles.fieldStack} key={filter}>
          {sortedLogs.map((log) => {
            const date = log.brewDate || log.createdAt;
            const isIced = log.tempType === "ice";
            return (
              <Link
                data-return-card={log.id}
                to={`/logs/${log.id}`}
                className={styles.entryLink}
                key={log.id}
              >
                <Card>
                  <div className={[styles.content, listStyles.record].join(" ")}>
                    <div className={listStyles.origin}>
                      <OriginFlag origin={log.bean.origin} size="md" />
                    </div>
                    <div className={[styles.fieldStack, styles.wrap].join(" ")}>
                      <h2 className={[styles.strong, styles.foreground].join(" ")}>
                        {log.bean.name}
                      </h2>
                      <div
                        className={[styles.row, styles.wrapping, styles.helper, styles.muted].join(
                          " ",
                        )}
                      >
                        <span className={styles.row}>
                          <Calendar size={12} aria-hidden="true" />
                          <time dateTime={date}>
                            {!log.brewDate && "登録日 "}
                            {formatDisplayDate(date)}
                          </time>
                        </span>
                        <span className={isIced ? styles.icedText : styles.hotText}>
                          {isIced ? "アイス" : "ホット"}
                        </span>
                        {(log.dripper?.name || log.method) && (
                          <span>• {log.dripper?.name || log.method}</span>
                        )}
                      </div>
                    </div>
                    {log.rating != null && (
                      <div className={[styles.warningPanel, styles.row].join(" ")}>
                        <Star
                          size={16}
                          className={[styles.ratingFilled, styles.fixed].join(" ")}
                          aria-hidden="true"
                        />
                        <span className={styles.strong}>{log.rating}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default LogsList;
