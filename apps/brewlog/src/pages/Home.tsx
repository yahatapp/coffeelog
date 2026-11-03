import { Loading, ErrorState } from "@yahatapp/ui";
import styles from "./content.module.css";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Coffee, ClipboardList, Star } from "lucide-react";
import { useLiff } from "../hooks/useLiff";
import { logQueries, type BrewLog } from "@/lib/queries";
import { CoffeeBeansIcon } from "../components/ui/CoffeeBeansIcon";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
const Home = () => {
  const { profile } = useLiff();
  const navigate = useNavigate();
  const logsQuery = useQuery({
    ...logQueries.all(),
    select: (logs): BrewLog[] => logs.slice(0, 3),
  });
  const recentLogs = logsQuery.data ?? [];
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
  };
  return (
    <div className={styles.stack}>
      <section>
        <h2 className={[styles.hero, styles.strong, styles.accent, styles.separated].join(" ")}>
          こんにちは、{profile?.displayName || "ゲスト"}さん
        </h2>
        <p className={[styles.body, styles.muted].join(" ")}>今日はどんなコーヒーを淹れますか？</p>
      </section>

      <Card>
        <CardHeader>
          <div className={[styles.row, styles.spread].join(" ")}>
            <CardTitle>最近の抽出記録</CardTitle>
            {recentLogs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/logs")} type="button">
                すべて見る
              </Button>
            )}
          </div>
        </CardHeader>
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
            <div className={styles.fieldStack}>
              {recentLogs.map((log) => (
                <Link
                  key={log.id}
                  className={[
                    styles.tonal,
                    styles.border,
                    styles.rounded,
                    styles.compact,
                    styles.row,
                    styles.spread,
                    styles.interactive,
                  ].join(" ")}
                  to={`/logs/${log.id}`}
                >
                  <div className={styles.row}>
                    <div
                      className={[
                        [styles.rounded, styles.elevated, styles.compact].join(" "),
                        log.tempType === "ice"
                          ? [styles.icedPanel, styles.icedText].join(" ")
                          : [styles.hotPanel, styles.hotText].join(" "),
                      ].join(" ")}
                    >
                      <Coffee
                        size={16}
                        role="img"
                        aria-label={log.tempType === "ice" ? "アイス" : "ホット"}
                      />
                    </div>
                    <div>
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
                        className={[styles.row, styles.helper, styles.muted, styles.separated].join(
                          " ",
                        )}
                      >
                        <span>{formatDate(log.createdAt)}</span>
                        {log.method && <span>• {log.method}</span>}
                      </p>
                    </div>
                  </div>
                  {log.rating && (
                    <div className={[styles.row, styles.warningText].join(" ")}>
                      <Star
                        size={14}
                        className={[styles.warningText, styles.ratingFilled].join(" ")}
                      />
                      <span className={[styles.helper, styles.strong].join(" ")}>{log.rating}</span>
                    </div>
                  )}
                </Link>
              ))}
              <Button onClick={() => navigate("/logs/new")} fullWidth type="button">
                <Plus size={18} />
                抽出を記録する
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <section className={styles.tiles}>
        <Link to={"/beans"} className={styles.entryLink}>
          <Card>
            <div className={[styles.content, styles.stack, styles.center].join(" ")}>
              <div className={[styles.tonal, styles.rounded, styles.compact].join(" ")}>
                <CoffeeBeansIcon size="md" className={styles.accent} aria-hidden="true" />
              </div>
              <span className={[styles.body, styles.strong].join(" ")}>豆を管理</span>
            </div>
          </Card>
        </Link>
        <Link to={"/logs"} className={styles.entryLink}>
          <Card>
            <div className={[styles.content, styles.stack, styles.center].join(" ")}>
              <div className={[styles.tonal, styles.rounded, styles.compact].join(" ")}>
                <ClipboardList size={24} className={styles.accent} />
              </div>
              <span className={[styles.body, styles.strong].join(" ")}>履歴を見る</span>
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
};
export default Home;
