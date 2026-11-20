import { PageHeading } from "@yahatapp/ui";
import {
  Loading,
  ErrorState,
  RecentRecord,
  RecentRecords,
  RecentRecordsHeader,
  formatDisplayDate,
} from "@yahatapp/ui";
import styles from "./content.module.css";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
import { useLiff } from "../hooks/useLiff";
import { logQueries, type BrewLog } from "@/lib/queries";
import { CoffeeBeansIcon } from "../components/ui/CoffeeBeansIcon";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
const Home = () => {
  const { profile } = useLiff();
  const logsQuery = useQuery({
    ...logQueries.all(),
    select: (logs): BrewLog[] => logs.slice(0, 3),
  });
  const recentLogs = logsQuery.data ?? [];
  return (
    <div className={styles.stack}>
      <section>
        <PageHeading
          className={[styles.hero, styles.strong, styles.accent, styles.separated].join(" ")}
        >
          こんにちは、{profile?.displayName || "ゲスト"}さん
        </PageHeading>
        <p className={[styles.body, styles.muted].join(" ")}>今日はどんなコーヒーを淹れますか？</p>
      </section>
      <Button asChild fullWidth>
        <Link to="/logs/new">
          <Plus size={18} aria-hidden="true" />
          抽出を記録する
        </Link>
      </Button>

      <Card>
        <RecentRecordsHeader
          title="最近登録した記録"
          action={recentLogs.length > 0 ? <Link to="/logs">すべて見る</Link> : undefined}
        />
        <CardContent>
          {logsQuery.isPending ? (
            <Loading />
          ) : logsQuery.isError ? (
            <div className={styles.center}>
              <ErrorState
                message={<>記録の取得に失敗しました。</>}
                onRetry={() => void logsQuery.refetch()}
              />
            </div>
          ) : recentLogs.length === 0 ? (
            <div className={styles.center}>
              <p className={[styles.body, styles.muted, styles.separated].join(" ")}>
                まだ記録がありません。
              </p>
            </div>
          ) : (
            <RecentRecords>
              {recentLogs.map((log) => {
                const date = log.brewDate || log.createdAt;
                const isIced = log.tempType === "ice";
                return (
                  <RecentRecord key={log.id}>
                    <Link to={`/logs/${log.id}`} data-return-card={log.id}>
                      <div className={styles.grow}>
                        <p
                          className={[
                            styles.body,
                            styles.strong,
                            styles.foreground,
                            styles.wrap,
                          ].join(" ")}
                        >
                          {log.bean.name}
                        </p>
                        <p
                          className={[
                            styles.row,
                            styles.wrapping,
                            styles.helper,
                            styles.muted,
                          ].join(" ")}
                        >
                          <time dateTime={date}>
                            {!log.brewDate && "登録日 "}
                            {formatDisplayDate(date)}
                          </time>
                          <span className={isIced ? styles.icedText : styles.hotText}>
                            {isIced ? "アイス" : "ホット"}
                          </span>
                          {log.method && <span>• {log.method}</span>}
                        </p>
                      </div>
                      {log.rating != null && (
                        <div
                          className={[styles.row, styles.warningText, styles.fixed].join(" ")}
                          role="img"
                          aria-label={`評価 ${log.rating}`}
                        >
                          <Star size={14} className={styles.ratingFilled} aria-hidden="true" />
                          <span className={[styles.helper, styles.strong].join(" ")}>
                            {log.rating}
                          </span>
                        </div>
                      )}
                    </Link>
                  </RecentRecord>
                );
              })}
            </RecentRecords>
          )}
        </CardContent>
      </Card>

      <section className={styles.tiles}>
        <Link to={"/beans"} className={styles.entryLink}>
          <Card>
            <div className={[styles.content, styles.stack, styles.center].join(" ")}>
              <CoffeeBeansIcon size="lg" className={styles.tileIcon} aria-hidden="true" />
              <span className={[styles.body, styles.strong].join(" ")}>豆を管理</span>
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
};
export default Home;
