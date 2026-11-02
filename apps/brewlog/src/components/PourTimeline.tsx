import { Check, Clock } from "lucide-react";
import type { BrewLogResponse } from "@/lib/queries";
import styles from "./pour-timeline.module.css";

type PourTimelineProps = Pick<
  BrewLogResponse,
  "pours" | "bloomingTime" | "drawdownTime" | "waterAmount"
>;

export function PourTimeline({
  pours,
  bloomingTime,
  drawdownTime,
  waterAmount,
}: PourTimelineProps) {
  return (
    <ol className={styles.timeline} aria-label="注水の手順">
      {pours?.map((pour, index) => (
        <li key={pour.id} className={styles.step}>
          <span className={styles.marker} aria-hidden="true">
            {pour.pourNumber}
          </span>
          <div className={styles.content}>
            <div className={styles.heading}>
              <span className={styles.stepTitle}>
                {pour.pourNumber}投目
                {pour.pourNumber === 1 && bloomingTime != null && bloomingTime > 0 && (
                  <span className={styles.bloom}>蒸らし</span>
                )}
              </span>
              <span className={styles.amount}>
                {pour.waterAmount}
                <span className={styles.unit}>ml</span>
              </span>
            </div>
            <span className={styles.method}>
              {pour.pourType === "all"
                ? "全体に"
                : pour.pourType === "center_around"
                  ? "中心付近"
                  : "中心のみ"}
            </span>
            {index < (pours?.length ?? 0) - 1 && (
              <span className={styles.duration}>
                <Clock size={14} aria-hidden="true" />
                {pour.duration} 秒後に次の注水
              </span>
            )}
          </div>
        </li>
      ))}
      {drawdownTime != null && (
        <li className={styles.step}>
          <span className={styles.marker} aria-hidden="true">
            <Check size={14} />
          </span>
          <div className={styles.completion}>
            <span className={styles.stepTitle}>落ち切り・抽出完了</span>
            <span className={styles.amount}>
              <Clock size={16} aria-hidden="true" />
              {Math.floor(drawdownTime / 60)}分{drawdownTime % 60}秒
            </span>
            {waterAmount != null && (
              <span className={styles.method}>総注水量 {waterAmount} ml</span>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}
