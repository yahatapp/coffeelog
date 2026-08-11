import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { ClipboardList, Plus, Star, Calendar, MessageSquare, Loader2 } from "lucide-react";
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

const LogsPage = () => {
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
        stars.push(<Star key={i} size={14} className="fill-cafe-accent text-cafe-accent" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={14} className="text-cafe-secondary/20" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={14} className="fill-cafe-accent text-cafe-accent" />
            </div>
          </div>,
        );
      } else {
        stars.push(<Star key={i} size={14} className="text-cafe-secondary/20" />);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-cafe-primary mb-4" size={32} />
        <p className="text-cafe-secondary text-sm">ログを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-red-100 p-6 text-center shadow-sm">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-cafe-primary text-white font-semibold py-2 px-6 rounded-xl hover:bg-cafe-primary/90 transition-all active:scale-95 text-sm"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClipboardList className="text-cafe-primary" size={24} />
          <h2 className="text-2xl font-bold text-cafe-text">記録一覧</h2>
        </div>
        <Link
          to="/logs/new"
          className="bg-cafe-primary text-white p-2 rounded-full shadow-md hover:bg-cafe-primary/95 active:scale-95 transition-all md:hidden"
          title="新規追加"
        >
          <Plus size={20} />
        </Link>
      </div>

      <div className="hidden md:block">
        <Link
          to="/logs/new"
          className="bg-cafe-primary text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:bg-cafe-primary/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 w-full text-sm"
        >
          <Plus size={16} />
          <span>新しい記録を追加する</span>
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-12 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-cafe-primary/5 flex items-center justify-center mx-auto border border-cafe-primary/10">
            <ClipboardList className="text-cafe-secondary" size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-cafe-text">まだ記録がありません</h3>
            <p className="text-sm text-cafe-secondary max-w-xs mx-auto leading-relaxed">
              カフェで飲んだ美味しい一杯やお店の雰囲気を記録しましょう！
            </p>
          </div>
          <Link
            to="/logs/new"
            className="inline-flex items-center justify-center bg-cafe-primary text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-cafe-primary/90 active:scale-[0.98] transition-all space-x-2 text-sm"
          >
            <Plus size={18} />
            <span>最初の記録を追加</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {logs.map((log) => (
            <Link
              key={log.id}
              to={`/logs/${log.id}`}
              className="block bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/15 p-5 shadow-sm hover:shadow-md hover:border-cafe-primary/20 transition-all active:scale-[0.99]"
            >
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-cafe-text text-base leading-snug">
                      {log.cafeName}
                    </h3>
                    {formatCoffeeInfo(log) && (
                      <p className="text-xs text-cafe-secondary font-medium mt-0.5">
                        {formatCoffeeInfo(log)}
                      </p>
                    )}
                  </div>
                  {log.rating && (
                    <div className="flex items-center space-x-1.5">
                      {renderStars(log.rating)}
                      <div className="inline-flex items-baseline text-cafe-secondary">
                        <span className="text-sm font-extrabold text-cafe-primary leading-none">
                          {log.rating}
                        </span>
                        <span className="text-[10px] font-semibold text-cafe-secondary/50 mx-0.5">
                          /
                        </span>
                        <span className="text-[10px] font-semibold text-cafe-secondary">5</span>
                      </div>
                    </div>
                  )}
                </div>

                {(log.note || log.price || log.visitDate) && (
                  <div className="border-t border-cafe-secondary/10 pt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-cafe-secondary">
                    {log.visitDate && (
                      <span className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{formatDate(log.visitDate)}</span>
                      </span>
                    )}
                    {log.price !== null && log.price !== undefined && (
                      <span className="flex items-center space-x-0.5">
                        <span className="text-[10px] font-bold">¥</span>
                        <span>{log.price.toLocaleString()}</span>
                      </span>
                    )}
                    {log.note && (
                      <span className="flex items-center space-x-1 flex-1 min-w-[150px] truncate">
                        <MessageSquare size={12} className="flex-shrink-0" />
                        <span className="truncate">{log.note}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      {logs.length > 0 && (
        <div className="fixed bottom-24 right-6 z-10 md:hidden">
          <Link
            to="/logs/new"
            className="flex items-center justify-center w-14 h-14 bg-cafe-primary text-white rounded-full shadow-lg shadow-cafe-primary/25 hover:bg-cafe-primary/95 active:scale-95 transition-all"
            title="新規追加"
          >
            <Plus size={24} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
