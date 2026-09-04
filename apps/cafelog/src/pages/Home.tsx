import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@yahatapp/ui";
import { Calendar, Coffee, Loader2, Plus, Star } from "lucide-react";
import { CoffeeAttributes } from "@/components/CoffeeAttributes";
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
    select: (logs) => logs.slice(0, 5),
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
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <Link
                  key={log.id}
                  to={`/logs/${log.id}`}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-cafe-secondary/5 bg-cafe-background/60 p-2.5 transition-colors hover:bg-cafe-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-primary"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cafe-primary/10 text-cafe-primary">
                    <Coffee size={17} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-cafe-text">
                      {log.cafeName}
                    </span>
                    <CoffeeAttributes coffee={log} compact />
                    {formatDate(log.visitDate) && (
                      <span className="mt-1.5 flex items-center gap-1 text-[10px] text-cafe-secondary">
                        <Calendar size={10} />
                        {formatDate(log.visitDate)}
                      </span>
                    )}
                  </span>

                  {log.rating && (
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-cafe-primary">
                      <Star size={11} className="fill-cafe-accent text-cafe-accent" />
                      {log.rating}
                    </span>
                  )}
                </Link>
              ))}

              <Button asChild className="mt-3 w-full">
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
