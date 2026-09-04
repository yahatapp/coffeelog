import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  ClipboardList,
  Star,
  Calendar,
  ArrowUp,
  ArrowDown,
  Snowflake,
  Sun,
} from "lucide-react";
import { logQueries, type BrewLog } from "@/lib/queries";
import { OriginFlag } from "@/components/ui/OriginFlag";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

const LogsList = () => {
  const navigate = useNavigate();
  const logsQuery = useQuery(logQueries.all());
  const logs: BrewLog[] = logsQuery.data ?? [];
  const [activeTab, setActiveTab] = useState<"all" | "hot" | "ice">("all");
  const [sortBy, setSortBy] = useState<"date" | "bean" | "rating">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const changeSort = (nextSort: "date" | "bean" | "rating") => {
    if (sortBy === nextSort) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
      return;
    }

    setSortBy(nextSort);
    setSortOrder(nextSort === "bean" ? "asc" : "desc");
  };

  const formatDate = (log: BrewLog) => {
    if (log.brewDate) {
      const [year, month, day] = log.brewDate.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
      return `${parseInt(month)}月${parseInt(day)}日(${dayOfWeek})`;
    }
    const date = new Date(log.createdAt);
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
  };

  const hotLogsCount = logs.filter((log) => log.tempType !== "ice").length;
  const iceLogsCount = logs.filter((log) => log.tempType === "ice").length;

  const filteredLogs = logs.filter((log) => {
    if (activeTab === "all") return true;
    if (activeTab === "hot") return log.tempType !== "ice";
    if (activeTab === "ice") return log.tempType === "ice";
    return true;
  });

  const getLogTimestamp = (log: BrewLog): number => {
    if (log.brewDate) {
      const [year, month, day] = log.brewDate.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    }
    return new Date(log.createdAt).getTime();
  };

  const sortedLogs = [...filteredLogs].toSorted((a, b) => {
    if (sortBy === "date") {
      const dateA = getLogTimestamp(a);
      const dateB = getLogTimestamp(b);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    }

    if (sortBy === "bean") {
      const nameA = a.bean.name;
      const nameB = b.bean.name;
      const nameCompare =
        sortOrder === "desc" ? nameB.localeCompare(nameA, "ja") : nameA.localeCompare(nameB, "ja");

      if (nameCompare !== 0) return nameCompare;

      // セカンドソート: 日付 (降順)
      const dateA = getLogTimestamp(a);
      const dateB = getLogTimestamp(b);
      return dateB - dateA;
    }

    if (sortBy === "rating") {
      const ratingA = a.rating;
      const ratingB = b.rating;

      if (ratingA === null && ratingB === null) {
        const dateA = getLogTimestamp(a);
        const dateB = getLogTimestamp(b);
        return dateB - dateA;
      }
      if (ratingA === null) return 1;
      if (ratingB === null) return -1;

      const ratingCompare = sortOrder === "desc" ? ratingB - ratingA : ratingA - ratingB;

      if (ratingCompare !== 0) return ratingCompare;

      // セカンドソート: 日付 (降順)
      const dateA = getLogTimestamp(a);
      const dateB = getLogTimestamp(b);
      return dateB - dateA;
    }

    return 0;
  });

  if (logsQuery.isPending) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
      </div>
    );
  }

  if (logsQuery.isError) {
    return (
      <div className="text-center p-8 text-coffee-secondary">
        <p>抽出履歴の取得に失敗しました。</p>
        <Button className="mt-4 rounded-xl" onClick={() => void logsQuery.refetch()}>
          再読み込み
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-coffee-primary">抽出履歴</h2>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => navigate("/logs/new")}
        >
          <Plus size={16} className="mr-1" /> 追加
        </Button>
      </div>

      {/* タブナビゲーション */}
      {logs.length > 0 && (
        <div className="flex p-1 bg-gray-100/80 rounded-xl space-x-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "all"
                ? "bg-white text-coffee-primary shadow-sm"
                : "text-coffee-secondary/70 hover:text-coffee-primary hover:bg-white/50"
            }`}
          >
            <span>すべて</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] transition-colors duration-200 ${
                activeTab === "all"
                  ? "bg-coffee-primary/10 text-coffee-primary"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("hot")}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "hot"
                ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100"
                : "text-coffee-secondary/70 hover:text-orange-600 hover:bg-orange-50/30"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>ホット</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] transition-colors duration-200 ${
                activeTab === "hot" ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-500"
              }`}
            >
              {hotLogsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ice")}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "ice"
                ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100"
                : "text-coffee-secondary/70 hover:text-blue-600 hover:bg-blue-50/30"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>アイス</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] transition-colors duration-200 ${
                activeTab === "ice" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
              }`}
            >
              {iceLogsCount}
            </span>
          </button>
        </div>
      )}

      {/* ソートUI */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-coffee-primary/10 bg-coffee-primary/5 p-2 text-xs text-coffee-secondary">
          <div className="flex items-center gap-2">
            <span className="shrink-0 font-semibold text-coffee-primary/80">ソート:</span>
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-lg bg-gray-200/60 p-1">
              <button
                onClick={() => changeSort("date")}
                aria-label={`日付で${sortBy === "date" && sortOrder === "desc" ? "昇順" : "降順"}に並べ替え`}
                className={`flex min-h-11 items-center justify-center rounded-md px-3 transition-all duration-200 cursor-pointer ${
                  sortBy === "date"
                    ? "bg-white text-coffee-primary shadow-sm font-bold"
                    : "text-coffee-secondary/70 hover:text-coffee-primary hover:bg-white/30"
                }`}
              >
                <span>日付</span>
                {sortBy === "date" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown size={10} className="ml-0.5 text-coffee-primary" />
                  ) : (
                    <ArrowUp size={10} className="ml-0.5 text-coffee-primary" />
                  ))}
              </button>

              <button
                onClick={() => changeSort("bean")}
                aria-label={`豆で${sortBy === "bean" && sortOrder === "asc" ? "降順" : "昇順"}に並べ替え`}
                className={`flex min-h-11 items-center justify-center rounded-md px-3 transition-all duration-200 cursor-pointer ${
                  sortBy === "bean"
                    ? "bg-white text-coffee-primary shadow-sm font-bold"
                    : "text-coffee-secondary/70 hover:text-coffee-primary hover:bg-white/30"
                }`}
              >
                <span>豆</span>
                {sortBy === "bean" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown size={10} className="ml-0.5 text-coffee-primary" />
                  ) : (
                    <ArrowUp size={10} className="ml-0.5 text-coffee-primary" />
                  ))}
              </button>

              <button
                onClick={() => changeSort("rating")}
                aria-label={`評価で${sortBy === "rating" && sortOrder === "desc" ? "昇順" : "降順"}に並べ替え`}
                className={`flex min-h-11 items-center justify-center rounded-md px-3 transition-all duration-200 cursor-pointer ${
                  sortBy === "rating"
                    ? "bg-white text-coffee-primary shadow-sm font-bold"
                    : "text-coffee-secondary/70 hover:text-coffee-primary hover:bg-white/30"
                }`}
              >
                <span>評価</span>
                {sortBy === "rating" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown size={10} className="ml-0.5 text-coffee-primary" />
                  ) : (
                    <ArrowUp size={10} className="ml-0.5 text-coffee-primary" />
                  ))}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center animate-in fade-in duration-300">
            <ClipboardList className="mx-auto text-coffee-secondary/30 mb-4" size={48} />
            <p className="text-coffee-secondary text-sm">
              {activeTab === "all"
                ? "記録はまだありません。"
                : activeTab === "hot"
                  ? "ホットコーヒーの記録はまだありません。"
                  : "アイスコーヒーの記録はまだありません。"}
            </p>
            <p className="text-xs text-coffee-secondary/60 mt-2">最高の一杯を記録しましょう！</p>
            <Button className="mt-6 rounded-xl" onClick={() => navigate("/logs/new")}>
              抽出を記録する
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-300" key={activeTab}>
          {sortedLogs.map((log) => (
            <Card
              key={log.id}
              className="hover:border-coffee-primary/30 transition-colors cursor-pointer hover:shadow-sm"
              onClick={() => navigate(`/logs/${log.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 space-y-1">
                    <h3 className="flex items-center gap-2 font-bold text-coffee-text">
                      <OriginFlag origin={log.bean.origin} size={16} />
                      <span>{log.bean.name}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-coffee-secondary">
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(log)}
                      </span>
                      {(log.dripper?.name || log.method) && (
                        <span>• {log.dripper?.name || log.method}</span>
                      )}
                      <span>•</span>
                      {log.tempType === "ice" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 font-bold text-blue-700 ring-1 ring-blue-200">
                          <Snowflake size={13} aria-hidden="true" />
                          アイス
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 font-bold text-orange-700 ring-1 ring-orange-200">
                          <Sun size={13} aria-hidden="true" />
                          ホット
                        </span>
                      )}
                    </div>
                  </div>
                  {log.rating && (
                    <div className="flex items-center rounded-xl bg-yellow-50 px-2.5 py-1.5 ring-1 ring-yellow-200">
                      <Star size={16} className="mr-1 fill-yellow-400 text-yellow-500" />
                      <span className="text-base font-black leading-none text-yellow-800">
                        {log.rating}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size}
    height={size}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default LogsList;
