import { Star } from "lucide-react";
import type { LogsResponse } from "@/lib/queries";
import { OriginFlag } from "./OriginFlag";
import styles from "./cafe-log-list-card.module.css";
type CafeLogListCardProps = { log: LogsResponse[number] };
const formatVisitDate = (date: string | null) => date?.replaceAll("-", ".") ?? "日付未登録";
const DetailItem = ({ label, value }: { label: string; value: string | null }) => (
  <div className={styles.detail}>
    <dt className={styles.muted}>{label}</dt>
    <dd className={styles.value}>{value || "未登録"}</dd>
  </div>
);
export const CafeLogListCard = ({ log }: CafeLogListCardProps) => (
  <article className={styles.root}>
    <div className={styles.summary}>
      <div className={styles.origin}>
        <OriginFlag origin={log.origin} />
        <p className={styles.muted}>{log.origin || "産地未登録"}</p>
        <span className={styles.badge}>
          {log.isBlend == null ? "未登録" : log.isBlend ? "ブレンド" : "シングル"}
        </span>
        <span className={styles.temperature} data-temperature={log.servingStyle ?? "unknown"}>
          {log.servingStyle === "iced"
            ? "アイス"
            : log.servingStyle === "hot"
              ? "ホット"
              : "未登録"}
        </span>
      </div>
      <div className={styles.main}>
        <h3 className={styles.title}>{log.cafeName}</h3>
        <div className={styles.visit}>
          <span>{log.prefecture || "都道府県未登録"}</span>
          <time dateTime={log.visitDate ?? undefined}>{formatVisitDate(log.visitDate)}</time>
        </div>
        <div className={styles.rating}>
          {log.rating == null ? (
            <span className={styles.muted}>スコア未登録</span>
          ) : (
            <>
              <Star size={17} className={styles.star} aria-hidden="true" />
              <span aria-label={`スコア ${log.rating} / 5`}>{log.rating} / 5</span>
            </>
          )}
        </div>
      </div>
    </div>
    <dl className={styles.details}>
      <DetailItem label="品種" value={log.variety} />
      <DetailItem label="精製方法" value={log.process} />
      <DetailItem label="焙煎度" value={log.roast} />
    </dl>
  </article>
);
