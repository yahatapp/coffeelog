import { Chip, formatDisplayDate } from "@yahatapp/ui";
import { Star } from "lucide-react";
import type { LogsResponse } from "@/lib/queries";
import { OriginFlag } from "./OriginFlag";
import styles from "./cafe-log-list-card.module.css";
type CafeLogListCardProps = { log: LogsResponse[number] };
const DetailItem = ({ label, value }: { label: string; value: string | null }) => (
  <div className={styles.detail}>
    <dt className={styles.muted}>{label}</dt>
    <dd className={styles.value}>{value}</dd>
  </div>
);
export const CafeLogListCard = ({ log }: CafeLogListCardProps) => (
  <article className={styles.root}>
    <div className={styles.summary}>
      <div className={styles.origin}>
        {log.origin && (
          <>
            <OriginFlag origin={log.origin} />
            <p className={styles.muted}>{log.origin}</p>
          </>
        )}
        {log.isBlend != null && <Chip>{log.isBlend ? "ブレンド" : "シングル"}</Chip>}
        {log.servingStyle && (
          <Chip tone={log.servingStyle === "iced" ? "iced" : "hot"}>
            {log.servingStyle === "iced" ? "アイス" : "ホット"}
          </Chip>
        )}
      </div>
      <div className={styles.main}>
        <h2 className={styles.title}>{log.cafeName}</h2>
        <div className={styles.visit}>
          {log.prefecture && <span>{log.prefecture}</span>}
          <time dateTime={log.visitDate ?? log.createdAt}>
            {!log.visitDate && "登録日 "}
            {formatDisplayDate(log.visitDate ?? log.createdAt)}
          </time>
        </div>
        {log.rating != null && (
          <div className={styles.rating}>
            <Star size={17} className={styles.star} aria-hidden="true" />
            <span aria-label={`評価 ${log.rating} / 5`}>{log.rating} / 5</span>
          </div>
        )}
      </div>
    </div>
    {(log.variety || log.process || log.roast) && (
      <dl className={styles.details}>
        {log.variety && <DetailItem label="品種" value={log.variety} />}
        {log.process && <DetailItem label="精製方法" value={log.process} />}
        {log.roast && <DetailItem label="焙煎度" value={log.roast} />}
      </dl>
    )}
  </article>
);
