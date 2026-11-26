import { PageHeading } from "@yahatapp/ui";
import styles from "./content.module.css";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Loading,
  ErrorState,
  EmptyState,
  RecentRecord,
  RecentRecords,
  RecentRecordsHeader,
  formatDisplayDate,
} from "@yahatapp/ui";
import { MapPin, Plus, Star } from "lucide-react";
import { OriginFlag } from "@/components/OriginFlag";
import { useLiff } from "@/hooks/useLiff";
import { cafelogQueries } from "@/lib/queries";

const HomePage = () => {
  const { profile } = useLiff();
  const logsQuery = useQuery({
    ...cafelogQueries.logs(),
    select: (logs) => logs.slice(0, 4),
  });
  const recentLogs = logsQuery.data ?? [];

  return (
    <div className={styles.page}>
      <PageHeading className={styles.greeting}>
        こんにちは、{profile?.displayName || "ゲスト"}さん
      </PageHeading>
      <Button asChild fullWidth>
        <Link to="/logs/new">
          <Plus size={18} aria-hidden="true" />
          新しい一杯を記録する
        </Link>
      </Button>
      <Card>
        <RecentRecordsHeader
          title="最近登録した記録"
          action={recentLogs.length > 0 ? <Link to="/logs">すべて見る</Link> : undefined}
        />
        <CardContent>
          {logsQuery.isPending ? (
            <Loading label="直近の記録を読み込み中..." />
          ) : logsQuery.isError ? (
            <ErrorState
              message="記録を取得できませんでした。"
              onRetry={() => void logsQuery.refetch()}
            />
          ) : recentLogs.length === 0 ? (
            <EmptyState title="まだ記録がありません。" />
          ) : (
            <RecentRecords>
              {recentLogs.map((log) => (
                <RecentRecord key={log.id}>
                  <Link to={`/logs/${log.id}`} data-return-card={log.id}>
                    <OriginFlag origin={log.origin} />
                    <span className={styles.recentBody}>
                      <span className={styles.recordTitle}>{log.cafeName}</span>
                      <span className={styles.visit}>
                        {log.origin && (
                          <span>
                            <MapPin size={11} aria-hidden="true" />
                            {log.origin}
                          </span>
                        )}
                        <time dateTime={log.visitDate ?? log.createdAt}>
                          {!log.visitDate && "登録日 "}
                          {formatDisplayDate(log.visitDate ?? log.createdAt)}
                        </time>
                      </span>
                    </span>
                    {log.rating != null && (
                      <span className={styles.rating} role="img" aria-label={`評価 ${log.rating}`}>
                        <Star size={14} className={styles.star} aria-hidden="true" />
                        {log.rating}
                      </span>
                    )}
                  </Link>
                </RecentRecord>
              ))}
            </RecentRecords>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default HomePage;
