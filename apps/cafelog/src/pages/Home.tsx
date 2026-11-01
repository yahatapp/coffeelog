import styles from "./content.module.css";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loading,
  ErrorState,
  EmptyState,
} from "@yahatapp/ui";
import { MapPin, Plus, Star } from "lucide-react";
import { OriginFlag } from "@/components/OriginFlag";
import { useLiff } from "@/hooks/useLiff";
import { getErrorMessage } from "@/lib/errors";
import { cafelogQueries } from "@/lib/queries";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
};

const HomePage = () => {
  const { profile } = useLiff();
  const logsQuery = useQuery({
    ...cafelogQueries.logs(),
    select: (logs) => logs.slice(0, 4),
  });
  const recentLogs = logsQuery.data ?? [];
  const errorMessage = logsQuery.error
    ? getErrorMessage(logsQuery.error, "記録の取得に失敗しました。")
    : null;

  return (
    <div className={styles.page}>
      <section>
        <h2 className={styles.greeting}>こんにちは、{profile?.displayName || "ゲスト"}さん</h2>
        <p className={styles.muted}>最近出会った一杯を振り返りましょう。</p>
      </section>
      <Card>
        <CardHeader>
          <div className={styles.header}>
            <CardTitle>最近のカフェ記録</CardTitle>
            {recentLogs.length > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/logs">すべて見る</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {logsQuery.isPending ? (
            <Loading label="直近の記録を読み込み中..." />
          ) : errorMessage ? (
            <ErrorState
              message="記録を取得できませんでした。"
              onRetry={() => void logsQuery.refetch()}
            />
          ) : recentLogs.length === 0 ? (
            <EmptyState
              title="まだ記録がありません。"
              action={
                <Button asChild fullWidth>
                  <Link to="/logs/new">
                    <Plus size={18} aria-hidden="true" />
                    最初の一杯を記録する
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className={styles.section}>
              {recentLogs.map((log) => (
                <Link key={log.id} to={`/logs/${log.id}`} className={styles.recentRecord}>
                  <OriginFlag origin={log.origin} />
                  <span className={styles.recentBody}>
                    <span className={styles.header}>
                      <span className={styles.recordTitle}>{log.cafeName}</span>
                      {log.rating != null && (
                        <span className={styles.rating} aria-label={`評価 ${log.rating}`}>
                          <Star size={14} className={styles.star} aria-hidden="true" />
                          {log.rating}
                        </span>
                      )}
                    </span>
                    <span className={styles.visit}>
                      {log.origin && (
                        <span>
                          <MapPin size={11} aria-hidden="true" />
                          {log.origin}
                        </span>
                      )}
                      {formatDate(log.visitDate) && (
                        <time dateTime={log.visitDate ?? undefined}>
                          {formatDate(log.visitDate)}
                        </time>
                      )}
                    </span>
                  </span>
                </Link>
              ))}
              <Button asChild fullWidth>
                <Link to="/logs/new">
                  <Plus size={18} aria-hidden="true" />
                  新しい一杯を記録する
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Button asChild variant="outline" fullWidth>
        <Link to="/logs">記録の履歴を見る</Link>
      </Button>
    </div>
  );
};
export default HomePage;
