import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@yahatapp/ui";
import { Loader2, MapPin, Plus, Star } from "lucide-react";
import { useLiff } from "@/hooks/useLiff";
import { getErrorMessage } from "@/lib/errors";
import { cafelogQueries } from "@/lib/queries";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
};

const HomePage = () => {
  const { profile } = useLiff();
  const logsQuery = useQuery({
    ...cafelogQueries.logs(),
    select: (logs) => logs.slice(0, 3),
  });
  const recentLogs = logsQuery.data ?? [];
  const errorMessage = logsQuery.error
    ? getErrorMessage(logsQuery.error, "記録の取得に失敗しました。")
    : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-5 duration-500">
      <section>
        <h2 className="mb-1 text-2xl font-bold text-cafe-primary">
          こんにちは、{profile?.displayName || "ゲスト"}さん
        </h2>
        <p className="text-sm text-cafe-secondary">最近出会った一杯を振り返りましょう。</p>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>最近のカフェ記録</span>
            {recentLogs.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-cafe-secondary">
                <Link to="/logs">すべて見る</Link>
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {logsQuery.isPending ? (
            <div className="flex justify-center py-8" aria-label="直近の記録を読み込み中">
              <Loader2 className="animate-spin text-cafe-primary/30" size={24} />
            </div>
          ) : errorMessage ? (
            <div className="py-4 text-center">
              <p className="mb-4 text-sm text-cafe-secondary">{errorMessage}</p>
              <Button className="w-full" onClick={() => void logsQuery.refetch()}>
                再読み込み
              </Button>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="py-4 text-center">
              <p className="mb-4 text-sm text-cafe-secondary">まだ記録がありません。</p>
              <Button asChild className="w-full">
                <Link to="/logs/new">
                  <Plus size={18} />
                  最初の一杯を記録する
                </Link>
              </Button>
            </div>
          ) : (
            <div>
              {recentLogs.map((log) => (
                <Link
                  key={log.id}
                  to={`/logs/${log.id}`}
                  className="group flex min-w-0 items-center justify-between gap-3 border-b border-cafe-secondary/10 px-1 py-3 first:pt-1 transition-colors last:border-b-0 hover:bg-cafe-background/60 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-primary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-cafe-text">
                        {log.cafeName}
                      </span>
                      {log.rating && (
                        <span
                          className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-cafe-primary"
                          aria-label={`評価 ${log.rating}`}
                        >
                          <Star
                            aria-hidden="true"
                            size={11}
                            className="fill-cafe-accent text-cafe-accent"
                          />
                          {log.rating}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-cafe-secondary">
                      {log.origin && (
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin aria-hidden="true" size={11} className="shrink-0" />
                          <span className="truncate">{log.origin}</span>
                        </span>
                      )}
                      {log.origin && formatDate(log.visitDate) && <span aria-hidden="true">•</span>}
                      {formatDate(log.visitDate) && (
                        <time className="shrink-0" dateTime={log.visitDate ?? undefined}>
                          {formatDate(log.visitDate)}
                        </time>
                      )}
                    </span>
                  </span>
                </Link>
              ))}

              <Button asChild className="mt-4 w-full">
                <Link to="/logs/new">
                  <Plus size={18} />
                  新しい一杯を記録する
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link to="/logs">記録の履歴を見る</Link>
      </Button>
    </div>
  );
};

export default HomePage;
