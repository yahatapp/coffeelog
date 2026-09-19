import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LogListControls, type LogSortOrder, type LogTemperatureFilter } from "@yahatapp/ui";
import { getErrorMessage } from "@/lib/errors";
import { cafelogQueries } from "@/lib/queries";
import { ClipboardList, Plus, Loader2 } from "lucide-react";
import { CafeLogListCard } from "@/components/CafeLogListCard";

const LogsPage = () => {
  const { data: logs = [], isPending: isLoading, error, refetch } = useQuery(cafelogQueries.logs());
  const errorMessage = error ? getErrorMessage(error, "通信エラーが発生しました。") : null;
  const [filter, setFilter] = useState<LogTemperatureFilter>("all");
  const [sortBy, setSortBy] = useState<"date" | "prefecture" | "rating">("date");
  const [sortOrder, setSortOrder] = useState<LogSortOrder>("desc");

  const changeSort = (nextSort: "date" | "prefecture" | "rating") => {
    if (sortBy === nextSort) {
      setSortOrder((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }
    setSortBy(nextSort);
    setSortOrder(nextSort === "prefecture" ? "asc" : "desc");
  };

  const filteredLogs = logs.filter((log) => filter === "all" || log.servingStyle === filter);
  const sortedLogs = filteredLogs.toSorted((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.visitDate ?? a.createdAt).getTime();
      const dateB = new Date(b.visitDate ?? b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    }

    if (sortBy === "prefecture") {
      if (!a.prefecture && !b.prefecture) return 0;
      if (!a.prefecture) return 1;
      if (!b.prefecture) return -1;
      const comparison = a.prefecture.localeCompare(b.prefecture, "ja");
      return sortOrder === "desc" ? -comparison : comparison;
    }

    if (a.rating == null && b.rating == null) return 0;
    if (a.rating == null) return 1;
    if (b.rating == null) return -1;
    return sortOrder === "desc" ? b.rating - a.rating : a.rating - b.rating;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-cafe-primary mb-4" size={32} />
        <p className="text-cafe-secondary text-sm">ログを読み込み中...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-red-100 p-6 text-center shadow-sm">
        <p className="text-red-500 font-semibold mb-4">{errorMessage}</p>
        <button
          onClick={() => void refetch()}
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

      {logs.length > 0 && (
        <LogListControls
          filter={filter}
          counts={{
            all: logs.length,
            hot: logs.filter((log) => log.servingStyle === "hot").length,
            iced: logs.filter((log) => log.servingStyle === "iced").length,
          }}
          onFilterChange={setFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          sortOptions={[
            { value: "date", label: "日付", initialOrder: "desc" },
            { value: "prefecture", label: "都道府県", initialOrder: "asc" },
            { value: "rating", label: "評価", initialOrder: "desc" },
          ]}
          onSortChange={changeSort}
        />
      )}

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
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cafe-secondary/20 bg-white/70 p-10 text-center">
          <ClipboardList className="mx-auto mb-3 text-cafe-secondary/40" size={36} />
          <p className="text-sm font-semibold text-cafe-secondary">
            {filter === "hot" ? "ホット" : "アイス"}の記録はまだありません。
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedLogs.map((log) => (
            <Link
              key={log.id}
              to={`/logs/${log.id}`}
              className="block min-w-0 overflow-hidden rounded-2xl border border-cafe-secondary/15 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:border-cafe-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-primary active:scale-[0.99]"
            >
              <CafeLogListCard log={log} />
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
