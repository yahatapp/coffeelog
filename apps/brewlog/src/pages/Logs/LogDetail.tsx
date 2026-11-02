import {
  Loading,
  ErrorState,
  EmptyState,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@yahatapp/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Thermometer,
  Scale,
  Droplet,
  Star,
  User,
  ChevronRight,
} from "lucide-react";
import { logQueries, type BrewLog } from "@/lib/queries";
import { OriginFlag } from "@/components/ui/OriginFlag";
import { PourTimeline } from "@/components/PourTimeline";
import styles from "./log-detail.module.css";

const formatBrewDate = (log: BrewLog) => {
  const date = log.brewDate ? new Date(`${log.brewDate}T00:00:00`) : new Date(log.createdAt);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    ...(!log.brewDate && { hour: "2-digit", minute: "2-digit" }),
  }).format(date);
};
const grindLabel = (clicks: number, grinder: BrewLog["grinder"]) => {
  if (clicks <= (grinder?.fineMax ?? 6)) return "細挽き";
  if (clicks <= (grinder?.mediumFineMax ?? 9)) return "中細挽き";
  if (clicks <= (grinder?.mediumMax ?? 15)) return "中挽き";
  if (clicks <= (grinder?.mediumCoarseMax ?? 22)) return "中粗挽き";
  return "粗挽き";
};
const formatSeconds = (seconds: number) =>
  seconds < 60
    ? `${seconds}秒`
    : `${Math.floor(seconds / 60)}分${seconds % 60 ? `${seconds % 60}秒` : ""}`;

const LogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const logQuery = useQuery(logQueries.detail(id ?? ""));
  if (logQuery.isPending) return <Loading />;
  if (logQuery.isError)
    return (
      <ErrorState
        message="抽出記録の取得に失敗しました。"
        onRetry={() => void logQuery.refetch()}
      />
    );
  const log = logQuery.data;
  if (!log)
    return (
      <EmptyState
        title="記録が見つかりませんでした。"
        action={
          <Button asChild>
            <Link to="/logs">履歴に戻る</Link>
          </Button>
        }
      />
    );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.titleRow}>
          <Button asChild variant="ghost" size="icon" aria-label="戻る">
            <Link to="/logs">
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
          </Button>
          <h2 className={styles.pageTitle}>抽出記録詳細</h2>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={`/logs/${log.id}/edit`}>
            <Edit2 size={14} aria-hidden="true" />
            編集
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className={styles.overview}>
            <div className={styles.metadata}>
              <span className={styles.date}>{formatBrewDate(log)}</span>
              <div className={styles.badges}>
                <span className={log.tempType === "ice" ? styles.iced : styles.hot}>
                  {log.tempType === "ice" ? "アイス" : "ホット"}
                </span>
                {log.rating != null && (
                  <span className={styles.rating} aria-label={`評価 ${log.rating} / 5`}>
                    <Star size={14} aria-hidden="true" />
                    {log.rating}
                    <span className={styles.ratingMax}>/ 5</span>
                  </span>
                )}
              </div>
            </div>
            <Link
              to={`/beans/${log.bean.id}`}
              className={styles.beanLink}
              aria-label={`${log.bean.name}の詳細を見る`}
            >
              <div className={styles.beanInfo}>
                <span className={styles.eyebrow}>コーヒー豆</span>
                <h3 className={styles.beanName}>{log.bean.name}</h3>
                {log.bean.origin && (
                  <span className={styles.origin}>
                    <OriginFlag origin={log.bean.origin} size="sm" />
                    {log.bean.origin}
                  </span>
                )}
                <span className={styles.linkLabel}>豆の詳細を見る</span>
              </div>
              <ChevronRight size={20} aria-hidden="true" className={styles.chevron} />
            </Link>
            <div className={styles.metrics} role="group" aria-label="抽出条件">
              {[
                { label: "湯温", value: log.waterTemp, unit: "℃", Icon: Thermometer },
                { label: "豆量", value: log.beanAmount, unit: "g", Icon: Scale },
                { label: "注水量", value: log.waterAmount, unit: "ml", Icon: Droplet },
              ].map(({ label, value, unit, Icon }) => (
                <div className={styles.metric} key={label}>
                  <Icon size={18} aria-hidden="true" />
                  <span className={styles.metricLabel}>{label}</span>
                  <span className={styles.metricValue}>
                    {value ?? "—"}
                    {value != null && <span className={styles.unit}>{unit}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>抽出レシピ詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className={styles.details}>
            <div className={styles.detailRow}>
              <dt>器具 / 方法</dt>
              <dd>
                {log.dripper?.name || log.method || "未設定"}
                {log.dripper && log.method && (
                  <span className={styles.secondary}>{log.method}</span>
                )}
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt>グラインダー</dt>
              <dd>{log.grinder?.name || "未設定"}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>挽き目</dt>
              <dd>
                {log.grindSize != null ? (
                  <>
                    {grindLabel(log.grindSize, log.grinder)}
                    <span className={styles.secondary}>{log.grindSize} clicks</span>
                  </>
                ) : (
                  "未設定"
                )}
              </dd>
            </div>
            {log.tempType === "ice" && (
              <div className={styles.detailRow}>
                <dt>氷の量</dt>
                <dd>{log.iceAmount != null ? `${log.iceAmount} g` : "未設定"}</dd>
              </div>
            )}
            {(log.tempType === "ice" || log.yieldAmount != null) && (
              <div className={styles.detailRow}>
                <dt>仕上がり量</dt>
                <dd>{log.yieldAmount != null ? `${log.yieldAmount} ml` : "未設定"}</dd>
              </div>
            )}
            {log.bloomingTime != null && (
              <div className={styles.detailRow}>
                <dt>蒸らし時間</dt>
                <dd>{log.bloomingTime} 秒</dd>
              </div>
            )}
            {log.drawdownTime != null && (
              <div className={styles.detailRow}>
                <dt>落ち切り時間</dt>
                <dd>{formatSeconds(log.drawdownTime)}</dd>
              </div>
            )}
            <div className={styles.detailRow}>
              <dt>加水</dt>
              <dd>{log.hasBypass ? "あり" : "なし"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {log.pours && log.pours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>注ぎ方レシピ・タイムライン</CardTitle>
          </CardHeader>
          <CardContent>
            <PourTimeline
              pours={log.pours}
              bloomingTime={log.bloomingTime}
              drawdownTime={log.drawdownTime}
              waterAmount={log.waterAmount}
            />
          </CardContent>
        </Card>
      )}

      {[
        { title: "抽出コメント", text: log.brewComment },
        { title: "テイスティングノート", text: log.note },
      ].map(
        ({ title, text }) =>
          text && (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={styles.note}>{text}</p>
              </CardContent>
            </Card>
          ),
      )}
      <div className={styles.author}>
        <span className={styles.authorLabel}>
          <User size={14} aria-hidden="true" />
          淹れた人
        </span>
        <span className={styles.authorName}>
          {log.user.avatarUrl && <img src={log.user.avatarUrl} alt="" className={styles.avatar} />}
          {log.user.displayName}
        </span>
      </div>
    </div>
  );
};
export default LogDetail;
