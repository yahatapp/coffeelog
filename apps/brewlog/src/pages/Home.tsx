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
import { useNavigate } from "react-router-dom";
import { Plus, Coffee, ClipboardList, Star } from "lucide-react";
import { useLiff } from "../hooks/useLiff";
import { logQueries, type BrewLog } from "@/lib/queries";
import { CoffeeBeansIcon } from "../components/ui/CoffeeBeansIcon";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
const Home = () => {
  const { profile } = useLiff();
  const navigate = useNavigate();
  const logsQuery = useQuery({
    ...logQueries.all(),
    select: (logs): BrewLog[] => logs.slice(0, 3),
  });
  const recentLogs = logsQuery.data ?? [];
  return (
    <div className={styles.stack}>
      <section>
        <h2 className={[styles.hero, styles.strong, styles.accent, styles.separated].join(" ")}>
          こんにちは、{profile?.displayName || "ゲスト"}さん
        </h2>
        <p className={[styles.body, styles.muted].join(" ")}>今日はどんなコーヒーを淹れますか？</p>
      </section>

      <Card>
        <RecentRecordsHeader
          title="最近の抽出記録"
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
              <Button onClick={() => navigate("/logs/new")} fullWidth type="button">
                <Plus size={18} />
                抽出を記録する
              </Button>
            </div>
          ) : (
            <RecentRecords
              footer={
                <Button onClick={() => navigate("/logs/new")} fullWidth type="button">
                  <Plus size={18} />
                  抽出を記録する
                </Button>
              }
            >
              {recentLogs.map((log) => {
                const date = log.brewDate || log.createdAt;
                const isIced = log.tempType === "ice";
                return (
                  <RecentRecord key={log.id}>
                    <Link to={`/logs/${log.id}`}>
                      <Coffee
                        size={16}
                        role="img"
                        aria-label={isIced ? "アイス" : "ホット"}
                        className={[styles.fixed, isIced ? styles.icedText : styles.hotText].join(
                          " ",
                        )}
                      />
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
                          <time dateTime={date}>{formatDisplayDate(date)}</time>
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
        <Link to={"/logs"} className={styles.entryLink}>
          <Card>
            <div className={[styles.content, styles.stack, styles.center].join(" ")}>
              <ClipboardList className={styles.tileIcon} aria-hidden="true" />
              <span className={[styles.body, styles.strong].join(" ")}>履歴を見る</span>
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
};
export default Home;
