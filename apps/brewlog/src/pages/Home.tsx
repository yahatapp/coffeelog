import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Coffee, ClipboardList, Loader2, Star } from "lucide-react";
import { useLiff } from "../hooks/useLiff";
import { logQueries, type BrewLog } from "@/lib/queries";
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-coffee-primary mb-1">
          こんにちは、{profile?.displayName || "ゲスト"}さん
        </h2>
        <p className="text-coffee-secondary text-sm">今日はどんなコーヒーを淹れますか？</p>
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            最近の抽出記録
            {recentLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-7 px-2 text-coffee-secondary"
                onClick={() => navigate("/logs")}
              >
                すべて見る
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isPending ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-coffee-primary/30" size={24} />
            </div>
          ) : logsQuery.isError ? (
            <div className="text-center py-4">
              <p className="text-coffee-secondary text-sm mb-4">記録の取得に失敗しました。</p>
              <Button className="w-full rounded-xl" onClick={() => void logsQuery.refetch()}>
                再読み込み
              </Button>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-coffee-secondary text-sm mb-4">まだ記録がありません。</p>
              <Button
                className="w-full rounded-xl bg-coffee-primary hover:bg-coffee-primary/90"
                onClick={() => navigate("/logs/new")}
              >
                <Plus size={18} className="mr-2" />
                抽出を記録する
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-coffee-background/50 border border-coffee-secondary/5 cursor-pointer hover:bg-coffee-background/80 transition-colors"
                  onClick={() => navigate(`/logs/${log.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl shadow-sm transition-colors ${
                        log.tempType === "ice"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-orange-50/80 text-orange-500"
                      }`}
                    >
                      <Coffee size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-coffee-text line-clamp-1">
                        {log.bean.name}
                      </p>
                      <p className="flex items-center text-[10px] text-coffee-secondary gap-1 mt-0.5">
                        <span>{formatDate(log.createdAt)}</span>
                        {log.method && <span>• {log.method}</span>}
                        <span>•</span>
                        {log.tempType === "ice" ? (
                          <span className="text-blue-500 font-semibold">アイス</span>
                        ) : (
                          <span className="text-orange-500/90 font-semibold">ホット</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {log.rating && (
                    <div className="flex items-center text-yellow-600">
                      <Star size={10} className="fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-[10px] font-bold">{log.rating}</span>
                    </div>
                  )}
                </div>
              ))}
              <Button
                className="w-full mt-2 rounded-xl bg-coffee-primary hover:bg-coffee-primary/90"
                onClick={() => navigate("/logs/new")}
              >
                <Plus size={18} className="mr-2" />
                抽出を記録する
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-4">
        <Card
          className="hover:border-coffee-primary/30 transition-colors cursor-pointer group"
          onClick={() => navigate("/beans")}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
            <div className="bg-coffee-background p-3 rounded-2xl group-hover:bg-coffee-primary/10 transition-colors">
              <Coffee size={24} className="text-coffee-secondary group-hover:text-coffee-primary" />
            </div>
            <span className="text-sm font-semibold">豆を管理</span>
          </CardContent>
        </Card>
        <Card
          className="hover:border-coffee-primary/30 transition-colors cursor-pointer group"
          onClick={() => navigate("/logs")}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
            <div className="bg-coffee-background p-3 rounded-2xl group-hover:bg-coffee-primary/10 transition-colors">
              <ClipboardList
                size={24}
                className="text-coffee-secondary group-hover:text-coffee-primary"
              />
            </div>
            <span className="text-sm font-semibold">履歴を見る</span>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
