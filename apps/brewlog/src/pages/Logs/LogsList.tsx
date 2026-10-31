import { Loading, ErrorState } from "@yahatapp/ui";
import styles from "../content.module.css";
import { Link } from "react-router-dom";
import { EmptyState } from "@yahatapp/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Star, Calendar, ArrowUp, ArrowDown, Snowflake, Sun } from "lucide-react";
import { logQueries, type BrewLog } from "@/lib/queries";
import { analytics } from "@/lib/analytics";
import { OriginFlag } from "@/components/ui/OriginFlag";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
const LogsList = () => {
  const navigate = useNavigate();
  const logsQuery = useQuery(logQueries.all());
  const logs: BrewLog[] = logsQuery.data ?? [];
  const [activeTab, setActiveTab] = useState<"all" | "hot" | "ice">("all");
  const [sortBy, setSortBy] = useState<"date" | "bean" | "rating">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const changeSort = (nextSort: "date" | "bean" | "rating") => {
    analytics.trackEvent("sort_change");
    if (sortBy === nextSort) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
      return;
    }
    setSortBy(nextSort);
    setSortOrder(nextSort === "bean" ? "asc" : "desc");
  };
  const formatDate = (log: BrewLog) => {
    if (log.brewDate) {
      const [year, month, day] = log.brewDate.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
      return `${parseInt(month)}月${parseInt(day)}日(${dayOfWeek})`;
    }
    const date = new Date(log.createdAt);
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
  };
  const hotLogsCount = logs.filter((log) => log.tempType !== "ice").length;
  const iceLogsCount = logs.filter((log) => log.tempType === "ice").length;
  const filteredLogs = logs.filter((log) => {
    if (activeTab === "all") return true;
    if (activeTab === "hot") return log.tempType !== "ice";
    if (activeTab === "ice") return log.tempType === "ice";
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
    return <Loading className={styles.state} />;
  }
  if (logsQuery.isError) {
    return (
      <div className={[styles.roomy, styles.center, styles.muted].join(" ")}>
        <ErrorState
          message={<>抽出履歴の取得に失敗しました。</>}
          onRetry={() => void logsQuery.refetch()}
        />
      </div>
    );
  }
  return (
    <div className={styles.stack}>
      <div className={[styles.row, styles.spread].join(" ")}>
        <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>抽出履歴</h2>
        <Button size="sm" variant="outline" onClick={() => navigate("/logs/new")} type="button">
          <Plus size={16} /> 追加
        </Button>
      </div>

      {/* タブナビゲーション */}
      {logs.length > 0 && (
        <div className={[styles.rounded, styles.compact, styles.row].join(" ")}>
          <button
            onClick={() => {
              analytics.trackEvent("filter_change");
              setActiveTab("all");
            }}
            className={[
              [
                styles.rounded,
                styles.row,
                styles.center,
                styles.grow,
                styles.target,
                styles.helper,
                styles.strong,
              ].join(" "),
              activeTab === "all"
                ? [styles.surface, styles.elevated, styles.accent, styles.selected].join(" ")
                : [styles.surface, styles.accent].join(" "),
            ].join(" ")}
            type="button"
            aria-pressed={activeTab === "all"}
          >
            <span>すべて</span>
            <span
              className={[
                [styles.pill, styles.helper].join(" "),
                activeTab === "all" ? [styles.tonal, styles.accent].join(" ") : styles.muted,
              ].join(" ")}
            >
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => {
              analytics.trackEvent("filter_change");
              setActiveTab("hot");
            }}
            className={[
              [
                styles.rounded,
                styles.row,
                styles.center,
                styles.grow,
                styles.target,
                styles.helper,
                styles.strong,
              ].join(" "),
              activeTab === "hot"
                ? [styles.hotPanel, styles.border, styles.elevated, styles.hotText].join(" ")
                : [styles.hotPanel, styles.hotText].join(" "),
            ].join(" ")}
            type="button"
            aria-pressed={activeTab === "hot"}
          >
            <span className={[styles.hotPanel, styles.pill].join(" ")} />
            <span>ホット</span>
            <span
              className={[
                [styles.pill, styles.helper].join(" "),
                activeTab === "hot" ? [styles.hotPanel, styles.hotText].join(" ") : styles.muted,
              ].join(" ")}
            >
              {hotLogsCount}
            </span>
          </button>

          <button
            onClick={() => {
              analytics.trackEvent("filter_change");
              setActiveTab("ice");
            }}
            className={[
              [
                styles.rounded,
                styles.row,
                styles.center,
                styles.grow,
                styles.target,
                styles.helper,
                styles.strong,
              ].join(" "),
              activeTab === "ice"
                ? [styles.icedPanel, styles.border, styles.elevated, styles.icedText].join(" ")
                : [styles.icedPanel, styles.icedText].join(" "),
            ].join(" ")}
            type="button"
            aria-pressed={activeTab === "ice"}
          >
            <span className={[styles.icedPanel, styles.pill].join(" ")} />
            <span>アイス</span>
            <span
              className={[
                [styles.pill, styles.helper].join(" "),
                activeTab === "ice" ? [styles.icedPanel, styles.icedText].join(" ") : styles.muted,
              ].join(" ")}
            >
              {iceLogsCount}
            </span>
          </button>
        </div>
      )}

      {/* ソートUI */}
      {logs.length > 0 && (
        <div
          className={[
            styles.tonal,
            styles.border,
            styles.rounded,
            styles.compact,
            styles.helper,
            styles.muted,
          ].join(" ")}
        >
          <div className={styles.row}>
            <span className={[styles.fixed, styles.strong, styles.accent].join(" ")}>ソート:</span>
            <div
              className={[styles.rounded, styles.compact, styles.metrics, styles.grow].join(" ")}
            >
              <button
                onClick={() => changeSort("date")}
                aria-label={`日付で${sortBy === "date" && sortOrder === "desc" ? "昇順" : "降順"}に並べ替え`}
                className={[
                  [
                    styles.rounded,
                    styles.row,
                    styles.center,
                    styles.target,
                    styles.interactive,
                  ].join(" "),
                  sortBy === "date"
                    ? [
                        styles.surface,
                        styles.elevated,
                        styles.strong,
                        styles.accent,
                        styles.selected,
                      ].join(" ")
                    : [styles.surface, styles.accent].join(" "),
                ].join(" ")}
                type="button"
                aria-pressed={sortBy === "date"}
              >
                <span>日付</span>
                {sortBy === "date" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown size={10} className={styles.accent} />
                  ) : (
                    <ArrowUp size={10} className={styles.accent} />
                  ))}
              </button>

              <button
                onClick={() => changeSort("bean")}
                aria-label={`豆で${sortBy === "bean" && sortOrder === "asc" ? "降順" : "昇順"}に並べ替え`}
                className={[
                  [
                    styles.rounded,
                    styles.row,
                    styles.center,
                    styles.target,
                    styles.interactive,
                  ].join(" "),
                  sortBy === "bean"
                    ? [
                        styles.surface,
                        styles.elevated,
                        styles.strong,
                        styles.accent,
                        styles.selected,
                      ].join(" ")
                    : [styles.surface, styles.accent].join(" "),
                ].join(" ")}
                type="button"
                aria-pressed={sortBy === "bean"}
              >
                <span>豆</span>
                {sortBy === "bean" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown size={10} className={styles.accent} />
                  ) : (
                    <ArrowUp size={10} className={styles.accent} />
                  ))}
              </button>

              <button
                onClick={() => changeSort("rating")}
                aria-label={`評価で${sortBy === "rating" && sortOrder === "desc" ? "昇順" : "降順"}に並べ替え`}
                className={[
                  [
                    styles.rounded,
                    styles.row,
                    styles.center,
                    styles.target,
                    styles.interactive,
                  ].join(" "),
                  sortBy === "rating"
                    ? [
                        styles.surface,
                        styles.elevated,
                        styles.strong,
                        styles.accent,
                        styles.selected,
                      ].join(" ")
                    : [styles.surface, styles.accent].join(" "),
                ].join(" ")}
                type="button"
                aria-pressed={sortBy === "rating"}
              >
                <span>評価</span>
                {sortBy === "rating" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown size={10} className={styles.accent} />
                  ) : (
                    <ArrowUp size={10} className={styles.accent} />
                  ))}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <EmptyState
          title={
            <>
              {activeTab === "all"
                ? "記録はまだありません。"
                : activeTab === "hot"
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
        <div className={styles.fieldStack} key={activeTab}>
          {sortedLogs.map((log) => (
            <Link to={`/logs/${log.id}`} className={styles.entryLink} key={log.id}>
              <Card>
                <div className={styles.content}>
                  <div className={[styles.row, styles.spread, styles.start].join(" ")}>
                    <div className={[styles.fieldStack, styles.grow].join(" ")}>
                      <h3 className={[styles.row, styles.strong, styles.foreground].join(" ")}>
                        <OriginFlag origin={log.bean.origin} size="md" />
                        <span>{log.bean.name}</span>
                      </h3>
                      <div
                        className={[styles.row, styles.wrapping, styles.helper, styles.muted].join(
                          " ",
                        )}
                      >
                        <span className={styles.row}>
                          <Calendar size={12} />
                          {formatDate(log)}
                        </span>
                        {(log.dripper?.name || log.method) && (
                          <span>• {log.dripper?.name || log.method}</span>
                        )}
                        <span>•</span>
                        {log.tempType === "ice" ? (
                          <span
                            className={[
                              styles.icedPanel,
                              styles.pill,
                              styles.row,
                              styles.strong,
                              styles.icedText,
                            ].join(" ")}
                          >
                            <Snowflake size={13} aria-hidden="true" />
                            アイス
                          </span>
                        ) : (
                          <span
                            className={[
                              styles.hotPanel,
                              styles.pill,
                              styles.row,
                              styles.strong,
                              styles.hotText,
                            ].join(" ")}
                          >
                            <Sun size={13} aria-hidden="true" />
                            ホット
                          </span>
                        )}
                      </div>
                    </div>
                    {log.rating && (
                      <div className={[styles.warningPanel, styles.rounded, styles.row].join(" ")}>
                        <Star
                          size={16}
                          className={[styles.warningText, styles.ratingFilled, styles.icon].join(
                            " ",
                          )}
                        />
                        <span className={[styles.strong, styles.warningText].join(" ")}>
                          {log.rating}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default LogsList;
