import { Star } from "lucide-react";
import type { LogsResponse } from "@/lib/queries";
import { OriginFlag } from "@/components/OriginFlag";

type CafeLogListCardProps = {
  log: LogsResponse[number];
};

const formatVisitDate = (date: string | null) => date?.replaceAll("-", ".") ?? "日付未登録";

const DetailItem = ({ label, value }: { label: string; value: string | null }) => (
  <div className="min-w-0 flex-1 px-2 text-center first:pl-0 last:pr-0">
    <dt className="text-[10px] font-medium text-cafe-secondary">{label}</dt>
    <dd className="mt-0.5 truncate text-xs font-bold text-cafe-text" title={value ?? undefined}>
      {value || "未登録"}
    </dd>
  </div>
);

export const CafeLogListCard = ({ log }: CafeLogListCardProps) => (
  <article className="min-w-0">
    <div className="grid min-w-0 grid-cols-[4.5rem_1fr] gap-4">
      <div className="flex min-w-0 flex-col items-center">
        <OriginFlag origin={log.origin} size={24} />
        <p className="mt-1.5 max-w-full break-words text-center text-[11px] font-semibold leading-tight text-cafe-secondary">
          {log.origin || "産地未登録"}
        </p>
        <div className="mt-3 flex w-full flex-col items-center gap-1.5">
          <span className="w-full rounded-full bg-cafe-primary/10 px-2 py-1 text-center text-[10px] font-bold text-cafe-primary">
            {log.isBlend == null ? "未登録" : log.isBlend ? "ブレンド" : "シングル"}
          </span>
          <span
            className={`w-full rounded-full px-2 py-1 text-center text-[10px] font-bold ${
              log.servingStyle === "iced"
                ? "bg-sky-100 text-sky-700"
                : log.servingStyle === "hot"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-cafe-secondary/10 text-cafe-secondary"
            }`}
          >
            {log.servingStyle === "iced"
              ? "アイス"
              : log.servingStyle === "hot"
                ? "ホット"
                : "未登録"}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="break-words text-base font-bold leading-snug text-cafe-text">
          {log.cafeName}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-cafe-secondary">
          <span className="min-w-0 truncate">{log.prefecture || "都道府県未登録"}</span>
          <time className="shrink-0 tabular-nums" dateTime={log.visitDate ?? undefined}>
            {formatVisitDate(log.visitDate)}
          </time>
        </div>
        <div className="mt-3 flex min-h-7 items-center">
          {log.rating == null ? (
            <span className="text-xs text-cafe-secondary/60">スコア未登録</span>
          ) : (
            <div
              className="inline-flex items-center gap-1.5"
              aria-label={`スコア ${log.rating} / 5`}
            >
              <Star aria-hidden="true" size={17} className="fill-cafe-accent text-cafe-accent" />
              <span className="text-xl font-extrabold leading-none text-cafe-primary">
                {log.rating}
              </span>
              <span className="text-[11px] font-semibold text-cafe-secondary">/ 5</span>
            </div>
          )}
        </div>
      </div>
    </div>

    <dl className="mt-4 flex divide-x divide-cafe-secondary/15 border-t border-cafe-secondary/10 pt-3">
      <DetailItem label="品種" value={log.variety} />
      <DetailItem label="精製方法" value={log.process} />
      <DetailItem label="焙煎度" value={log.roast} />
    </dl>
  </article>
);
