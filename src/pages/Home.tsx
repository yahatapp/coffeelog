import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLiff } from "@/hooks/useLiff";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import {
  ArrowRight,
  Coffee,
  ClipboardList,
  Plus,
  Star,
  Calendar,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { InferResponseType } from "hono/client";

type LogsResponse = InferResponseType<typeof api.api.logs.$get>;
type LogItem = LogsResponse[number];

const formatCoffeeInfo = (log: {
  origin?: string | null;
  region?: string | null;
  variety?: string | null;
  farm?: string | null;
  process?: string | null;
  roast?: string | null;
  isBlend?: boolean | null;
}) => {
  const parts = [];
  if (log.origin) parts.push(log.origin);
  if (log.region) parts.push(log.region);
  if (log.farm) parts.push(log.farm);
  if (log.variety) parts.push(log.variety);

  let base = parts.join(" ");

  const tags = [];
  if (log.process) tags.push(log.process);
  if (log.roast) tags.push(log.roast);
  if (log.isBlend !== null && log.isBlend !== undefined) {
    tags.push(log.isBlend ? "ブレンド" : "シングル");
  }

  if (tags.length > 0) {
    base += ` (${tags.join(" / ")})`;
  }

  return base.trim() || "";
};

const HomePage = () => {
  const { profile } = useLiff();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.api.logs.$get();
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        } else {
          console.error("Failed to fetch logs", res.status);
          setError("ログの取得に失敗しました。");
        }
      } catch (err: unknown) {
        console.error("Error fetching logs", err);
        setError(getErrorMessage(err, "通信エラーが発生しました。"));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLogs();
  }, []);

  const renderStars = (rating: number | null | undefined) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={12} className="fill-cafe-accent text-cafe-accent" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={12} className="text-cafe-secondary/20" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={12} className="fill-cafe-accent text-cafe-accent" />
            </div>
          </div>,
        );
      } else {
        stars.push(<Star key={i} size={12} className="text-cafe-secondary/20" />);
      }
    }
    return <div className="flex items-center space-x-0.5">{stars}</div>;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cafe-primary/10 mb-4">
          <Coffee className="text-cafe-primary" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-cafe-text">
          {profile ? `${profile.displayName}さん` : "Cafelog"}
        </h2>
        <p className="text-cafe-secondary mt-2">カフェコーヒーの記録をはじめよう</p>
      </div>

      <Link
        to="/logs/new"
        className="group flex items-center gap-4 rounded-2xl border border-cafe-secondary/20 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:border-cafe-primary/30 hover:shadow-md active:scale-[0.99]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cafe-primary text-white shadow-sm transition-transform group-hover:scale-105">
          <Plus size={24} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-cafe-text">新しい記録を追加</span>
          <span className="mt-1 block text-xs leading-relaxed text-cafe-secondary">
            カフェで飲んだコーヒーを記録する
          </span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="shrink-0 text-cafe-secondary transition-transform group-hover:translate-x-1 group-hover:text-cafe-primary"
          size={20}
        />
      </Link>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="animate-spin text-cafe-primary mb-2" size={24} />
          <p className="text-cafe-secondary text-xs">直近の記録を読み込み中...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-red-500 text-xs font-semibold">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 text-center shadow-sm space-y-4">
          <p className="text-xs text-cafe-secondary leading-relaxed">
            まだコーヒーの記録がありません。美味しい一杯を記録してみませんか？
          </p>
          <Link
            to="/logs/new"
            className="inline-flex items-center justify-center bg-cafe-primary text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:bg-cafe-primary/90 active:scale-[0.98] transition-all space-x-1.5 text-xs"
          >
            <Plus size={14} />
            <span>最初の記録を追加</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-cafe-text text-sm flex items-center space-x-1.5">
              <ClipboardList className="text-cafe-primary" size={16} />
              <span>直近の記録</span>
            </h3>
            <Link
              to="/logs"
              className="text-xs font-bold text-cafe-primary hover:underline transition-all"
            >
              すべての記録を見る &rarr;
            </Link>
          </div>
          <div className="grid gap-3">
            {logs.slice(0, 3).map((log) => (
              <Link
                key={log.id}
                to={`/logs/${log.id}`}
                className="block min-w-0 overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/15 p-4 shadow-sm hover:shadow-md hover:border-cafe-primary/20 transition-all active:scale-[0.99]"
              >
                <div className="flex min-w-0 flex-col space-y-2">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="break-words font-bold text-cafe-text text-sm leading-snug">
                        {log.cafeName}
                      </h4>
                      {formatCoffeeInfo(log) && (
                        <p className="break-words text-[10px] text-cafe-secondary font-medium mt-0.5">
                          {formatCoffeeInfo(log)}
                        </p>
                      )}
                    </div>
                    {log.rating && (
                      <div className="flex shrink-0 items-center space-x-1">
                        {renderStars(log.rating)}
                        <div className="inline-flex items-baseline text-cafe-secondary">
                          <span className="text-xs font-extrabold text-cafe-primary leading-none">
                            {log.rating}
                          </span>
                          <span className="text-[8px] font-semibold text-cafe-secondary/50 mx-0.5">
                            /
                          </span>
                          <span className="text-[8px] font-semibold text-cafe-secondary">5</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {(log.note || log.price || log.visitDate) && (
                    <div className="border-t border-cafe-secondary/5 pt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-cafe-secondary">
                      {log.visitDate && (
                        <span className="flex items-center space-x-1">
                          <Calendar size={10} />
                          <span>{formatDate(log.visitDate)}</span>
                        </span>
                      )}
                      {log.price !== null && log.price !== undefined && (
                        <span className="flex items-center space-x-0.5">
                          <span className="text-[8px] font-bold">¥</span>
                          <span>{log.price.toLocaleString()}</span>
                        </span>
                      )}
                      {log.note && (
                        <span className="flex max-w-full min-w-0 flex-1 items-center space-x-1 truncate">
                          <MessageSquare size={10} className="flex-shrink-0" />
                          <span className="truncate">{log.note}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
