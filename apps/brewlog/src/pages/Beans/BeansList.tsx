import { Loading, ErrorState } from "@yahatapp/ui";
import styles from "../content.module.css";
import { Link } from "react-router-dom";
import { Checkbox, EmptyState } from "@yahatapp/ui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Plus,
  Coffee,
  ChevronRight,
  Pencil,
  Sparkles,
} from "lucide-react";
import { beanQueries, logQueries } from "@/lib/queries";
import { groupBeanVersions } from "@/lib/bean-versions";
import { analytics } from "@/lib/analytics";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { OriginFlag } from "../../components/ui/OriginFlag";
import { getCountryCode } from "@/utils/flag";
import { CoffeeBeansIcon } from "../../components/ui/CoffeeBeansIcon";
import { RoastLevelIndicator } from "../../components/ui/RoastLevelIndicator";
const BeansList = () => {
  const navigate = useNavigate();
  const beansQuery = useQuery(beanQueries.all());
  const logsQuery = useQuery(logQueries.all());
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name" | "brews">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const beans = useMemo(() => beansQuery.data ?? [], [beansQuery.data]);
  const groupedBeans = useMemo(() => groupBeanVersions(beans), [beans]);
  const brewCountByGroupId = useMemo(() => {
    const counts = new Map<string, number>();
    const groupIdByBeanId = new Map(
      (beansQuery.data ?? []).map((bean) => [bean.id, bean.parentBeanId || bean.id] as const),
    );
    for (const log of logsQuery.data ?? []) {
      const groupId = groupIdByBeanId.get(log.beanId);
      if (groupId) counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }
    return counts;
  }, [beansQuery.data, logsQuery.data]);
  const visibleBeans = useMemo(() => {
    const groups = groupedBeans.filter((group) => showArchived || !group.isArchived);
    return groups.toSorted((a, b) => {
      let comparison: number;
      if (sortBy === "name") {
        comparison = a.latestBean.name.localeCompare(b.latestBean.name, "ja");
      } else if (sortBy === "brews") {
        comparison =
          (brewCountByGroupId.get(a.groupId) ?? 0) - (brewCountByGroupId.get(b.groupId) ?? 0);
      } else {
        comparison =
          new Date(a.latestBean.createdAt).getTime() - new Date(b.latestBean.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [brewCountByGroupId, groupedBeans, showArchived, sortBy, sortOrder]);
  const changeSort = (nextSort: typeof sortBy) => {
    analytics.trackEvent("sort_change");
    if (sortBy === nextSort) setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    else {
      setSortBy(nextSort);
      setSortOrder(nextSort === "name" ? "asc" : "desc");
    }
  };
  if (beansQuery.isPending) {
    return <Loading className={styles.state} />;
  }
  if (beansQuery.isError) {
    return (
      <div className={[styles.roomy, styles.center, styles.muted].join(" ")}>
        <ErrorState
          message={<>豆一覧の取得に失敗しました。</>}
          onRetry={() => void beansQuery.refetch()}
        />
      </div>
    );
  }
  return (
    <div className={styles.stack}>
      <div className={[styles.row, styles.spread].join(" ")}>
        <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>コーヒー豆一覧</h2>
        <Button size="sm" variant="outline" onClick={() => navigate("/beans/new")} type="button">
          <Plus size={16} /> 追加
        </Button>
      </div>

      {groupedBeans.length > 0 && (
        <div
          className={[
            styles.tonal,
            styles.border,
            styles.rounded,
            styles.compact,
            styles.fieldStack,
          ].join(" ")}
        >
          <label
            className={[
              styles.row,
              styles.spread,
              styles.target,
              styles.body,
              styles.strong,
              styles.accent,
              styles.interactive,
            ].join(" ")}
          >
            <span>アーカイブも表示</span>
            <Checkbox
              type="checkbox"
              checked={showArchived}
              onChange={(event) => {
                analytics.trackEvent("filter_change");
                setShowArchived(event.target.checked);
              }}
            />
          </label>
          <div
            className={[styles.surface, styles.rounded, styles.compact, styles.metrics].join(" ")}
          >
            {(["date", "name", "brews"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeSort(option)}
                className={[
                  [
                    styles.rounded,
                    styles.row,
                    styles.center,
                    styles.target,
                    styles.helper,
                    styles.strong,
                  ].join(" "),
                  sortBy === option
                    ? [styles.surface, styles.elevated, styles.accent, styles.selected].join(" ")
                    : styles.muted,
                ].join(" ")}
                aria-pressed={sortBy === option}
              >
                {option === "date" ? "登録日" : option === "name" ? "豆名" : "抽出回数"}
                {sortBy === option &&
                  (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
              </button>
            ))}
          </div>
        </div>
      )}

      {logsQuery.isError && (
        <div
          className={[
            styles.tonal,
            styles.rounded,
            styles.content,
            styles.row,
            styles.spread,
            styles.helper,
            styles.muted,
          ].join(" ")}
          role="status"
        >
          <p>抽出回数を取得できませんでした。豆の管理は引き続き行えます。</p>
          <Button size="sm" variant="ghost" onClick={() => void logsQuery.refetch()} type="button">
            再試行
          </Button>
        </div>
      )}

      {visibleBeans.length === 0 ? (
        <EmptyState
          title={
            <>
              {groupedBeans.length > 0
                ? "表示できる豆はありません。"
                : "登録されている豆はありません。"}
            </>
          }
          description={<>お気に入りの豆を登録しましょう！</>}
          action={
            <Button onClick={() => navigate("/beans/new")} type="button">
              豆を登録する
            </Button>
          }
        />
      ) : (
        <div className={styles.fieldStack}>
          {visibleBeans.map((group) => {
            const { latestBean } = group;
            const brewCount = brewCountByGroupId.get(group.groupId) ?? 0;
            const displayDate = latestBean.purchaseDate ?? latestBean.roastDate;
            return (
              <Card key={group.groupId}>
                <div className={[styles.content, styles.row].join(" ")}>
                  <Link to={`/beans/${latestBean.id}`} className={styles.entryLink}>
                    <div className={[styles.row, styles.grow].join(" ")}>
                      <div
                        className={[
                          styles.tonal,
                          styles.rounded,
                          styles.row,
                          styles.center,
                          styles.fixed,
                          styles.clipped,
                        ].join(" ")}
                      >
                        {(() => {
                          const countryCode = getCountryCode(latestBean.origin);
                          const isBlend =
                            !latestBean.origin ||
                            latestBean.origin.toLowerCase().includes("ブレンド") ||
                            latestBean.origin.toLowerCase().includes("blend") ||
                            latestBean.name.toLowerCase().includes("ブレンド") ||
                            latestBean.name.toLowerCase().includes("blend");
                          if (!isBlend && countryCode) {
                            return <OriginFlag origin={latestBean.origin} size="lg" />;
                          }
                          return <CoffeeBeansIcon size="md" className={styles.accent} />;
                        })()}
                      </div>
                      <div className={[styles.fieldStack, styles.grow].join(" ")}>
                        <h3 className={[styles.strong, styles.foreground, styles.wrap].join(" ")}>
                          {latestBean.name}
                        </h3>
                        {(latestBean.roastLevel || group.isArchived) && (
                          <div className={[styles.row, styles.wrapping].join(" ")}>
                            {group.isArchived && (
                              <span
                                className={[
                                  styles.tonal,
                                  styles.pill,
                                  styles.row,
                                  styles.helper,
                                  styles.strong,
                                  styles.accent,
                                ].join(" ")}
                              >
                                <Archive size={14} aria-hidden="true" />
                                アーカイブ済み
                              </span>
                            )}
                            {latestBean.roastLevel && (
                              <RoastLevelIndicator level={latestBean.roastLevel} />
                            )}
                          </div>
                        )}
                        <div
                          className={[
                            styles.row,
                            styles.wrapping,
                            styles.helper,
                            styles.muted,
                          ].join(" ")}
                        >
                          <span
                            className={[
                              styles.row,
                              latestBean.coffeeType === "specialty" ? styles.warningText : "",
                            ].join(" ")}
                          >
                            {latestBean.coffeeType === "specialty" && (
                              <Sparkles
                                size={13}
                                className={styles.warningText}
                                aria-hidden="true"
                              />
                            )}
                            {latestBean.coffeeType === "specialty"
                              ? "スペシャルティ"
                              : "レギュラー"}
                          </span>
                          <span className={styles.row}>
                            <Coffee size={13} aria-hidden="true" />
                            {logsQuery.isPending
                              ? "抽出回数を取得中"
                              : logsQuery.isError
                                ? "抽出回数未取得"
                                : `${brewCount}杯`}
                          </span>
                          <span>
                            {displayDate
                              ? `${latestBean.purchaseDate ? "" : "焙煎 "}${displayDate.replace(/-/g, ".")}`
                              : "日付未設定"}
                          </span>
                        </div>
                        <div
                          className={[
                            styles.row,
                            styles.wrapping,
                            styles.separated,
                            styles.optionalDetails,
                          ].join(" ")}
                        >
                          {latestBean.origin && (
                            <span
                              className={[
                                styles.tonal,
                                styles.pill,
                                styles.row,
                                styles.helper,
                                styles.muted,
                              ].join(" ")}
                            >
                              <OriginFlag origin={latestBean.origin} size="sm" />
                              {latestBean.origin}
                            </span>
                          )}
                          {latestBean.purchaseStore && (
                            <span
                              className={[
                                styles.tonal,
                                styles.pill,
                                styles.helper,
                                styles.muted,
                              ].join(" ")}
                            >
                              {latestBean.purchaseStore}
                            </span>
                          )}
                          {latestBean.processMethod && (
                            <span
                              className={[
                                styles.tonal,
                                styles.pill,
                                styles.helper,
                                styles.muted,
                              ].join(" ")}
                            >
                              {latestBean.processMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div
                    className={[
                      styles.surface,
                      styles.pill,
                      styles.elevated,
                      styles.compact,
                      styles.row,
                      styles.fixed,
                    ].join(" ")}
                  >
                    <button
                      disabled={group.isArchived}
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigate(`/beans/${latestBean.id}/edit`);
                      }}
                      className={[styles.tonal, styles.pill, styles.compact, styles.accent].join(
                        " ",
                      )}
                      title="最新の豆を編集"
                      type="button"
                      aria-label="最新の豆を編集"
                    >
                      <Pencil size={16} />
                    </button>
                    <ChevronRight size={18} className={styles.accent} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default BeansList;
