import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Thermometer,
  Scale,
  Droplet,
  Star,
  User,
  Info,
  Check,
  ChevronRight,
} from "lucide-react";
import { logQueries, type BrewLog, type BrewLogResponse } from "@/lib/queries";
import { Button, cn } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { OriginFlag } from "../../components/ui/OriginFlag";

const LogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const logQuery = useQuery(logQueries.detail(id ?? ""));
  const log: BrewLogResponse | null = logQuery.data ?? null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}年${month}月${day}日(${dayOfWeek}) ${hour}:${minute}`;
  };

  const getBrewDateDisplay = (log: BrewLog) => {
    if (log.brewDate) {
      const [year, month, day] = log.brewDate.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
      return `${year}年${parseInt(month)}月${parseInt(day)}日(${dayOfWeek})`;
    }
    return formatDate(log.createdAt);
  };

  const getGrindLabel = (clicks: number | null, grinder: BrewLog["grinder"]) => {
    if (clicks === null) return null;
    const fm = grinder?.fineMax ?? 6;
    const mfm = grinder?.mediumFineMax ?? 9;
    const mm = grinder?.mediumMax ?? 15;
    const mcm = grinder?.mediumCoarseMax ?? 22;

    if (clicks <= fm) return "細挽き";
    if (clicks <= mfm) return "中細挽き";
    if (clicks <= mm) return "中挽き";
    if (clicks <= mcm) return "中粗挽き";
    return "粗挽き";
  };

  if (logQuery.isPending) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
      </div>
    );
  }

  if (logQuery.isError) {
    return (
      <div className="text-center p-8 text-coffee-secondary">
        <p>抽出記録の取得に失敗しました。</p>
        <Button className="mt-4" onClick={() => void logQuery.refetch()}>
          再読み込み
        </Button>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="text-center p-8">
        <p className="text-coffee-secondary">記録が見つかりませんでした。</p>
        <Button onClick={() => navigate("/logs")} className="mt-4">
          履歴に戻る
        </Button>
      </div>
    );
  }

  const grindLabel = getGrindLabel(log.grindSize, log.grinder);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/logs")}
            className="rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-coffee-primary">抽出記録詳細</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-coffee-primary/30 text-coffee-primary hover:bg-coffee-primary/5"
          onClick={() => navigate(`/logs/${log.id}/edit`)}
        >
          <Edit2 size={14} className="mr-1" /> 編集
        </Button>
      </div>

      {/* Main Coffee Card */}
      <Card className="overflow-hidden border-2 border-coffee-primary/10 shadow-md">
        <div className="bg-coffee-primary/5 p-4 border-b border-coffee-primary/10">
          <span className="text-[10px] uppercase tracking-wider font-bold text-coffee-secondary block">
            コーヒー豆
          </span>
          <div className="flex justify-between items-center mt-1">
            <button
              type="button"
              onClick={() => navigate(`/beans/${log.bean.id}`)}
              className="group min-w-0 rounded-xl -m-2 p-2 text-left transition-colors hover:bg-coffee-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary"
              aria-label={`${log.bean.name}の詳細を見る`}
            >
              <h3 className="text-lg font-bold text-coffee-primary leading-tight">
                {log.bean.name}
                <ChevronRight
                  size={16}
                  className="ml-1 inline transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </h3>
              <div className="mt-1.5">
                {log.bean.origin && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-coffee-secondary">産地:</span>
                    <OriginFlag origin={log.bean.origin} size={11} />
                    <span className="text-xs text-coffee-secondary font-medium">
                      {log.bean.origin}
                    </span>
                  </div>
                )}
              </div>
            </button>
            <div className="flex flex-col items-end gap-1.5 ml-4">
              {log.rating && (
                <div className="flex items-center bg-yellow-400/10 border border-yellow-400/25 px-2.5 py-1 rounded-xl">
                  <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm font-black text-yellow-700">{log.rating}</span>
                </div>
              )}
              {log.tempType === "ice" ? (
                <span className="flex items-center justify-center bg-blue-50 text-blue-700 border border-blue-200/50 w-[50px] h-[30px] rounded-xl text-sm shadow-sm animate-in fade-in duration-300">
                  ❄️
                </span>
              ) : (
                <span className="flex items-center justify-center bg-orange-50 text-orange-700 border border-orange-200/50 w-[50px] h-[30px] rounded-xl text-sm shadow-sm animate-in fade-in duration-300">
                  ☕
                </span>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-coffee-background/50 p-3 rounded-2xl border border-coffee-secondary/5">
              <div className="flex justify-center text-coffee-secondary mb-1">
                <Thermometer size={18} />
              </div>
              <span className="text-[10px] text-coffee-secondary block">湯温</span>
              <span className="text-base font-bold text-coffee-text">
                {log.waterTemp ? `${log.waterTemp}℃` : "---"}
              </span>
            </div>
            <div className="bg-coffee-background/50 p-3 rounded-2xl border border-coffee-secondary/5">
              <div className="flex justify-center text-coffee-secondary mb-1">
                <Scale size={18} />
              </div>
              <span className="text-[10px] text-coffee-secondary block">豆量</span>
              <span className="text-base font-bold text-coffee-text">
                {log.beanAmount ? `${log.beanAmount}g` : "---"}
              </span>
            </div>
            <div className="bg-coffee-background/50 p-3 rounded-2xl border border-coffee-secondary/5">
              <div className="flex justify-center text-coffee-secondary mb-1">
                <Droplet size={18} />
              </div>
              <span className="text-[10px] text-coffee-secondary block">注水量</span>
              <span className="text-base font-bold text-coffee-text">
                {log.waterAmount ? `${log.waterAmount}ml` : "---"}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-4 pt-2 border-t border-coffee-secondary/10">
            <h4 className="text-xs font-bold text-coffee-secondary uppercase tracking-wider">
              抽出レシピ詳細
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                <span className="text-coffee-secondary">抽出器具 / 方法</span>
                <span className="font-semibold text-coffee-text">
                  {log.dripper?.name || log.method || "未設定"}
                  {log.dripper && log.method && (
                    <span className="text-xs font-normal text-coffee-secondary ml-1">
                      ({log.method})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                <span className="text-coffee-secondary">グラインダー</span>
                <span className="font-semibold text-coffee-text">
                  {log.grinder?.name || "未設定"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                <span className="text-coffee-secondary">挽き目 (クリック数)</span>
                <span className="font-semibold text-coffee-text">
                  {log.grindSize !== null ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="bg-coffee-primary/10 text-coffee-primary px-2 py-0.5 rounded-full text-xs font-bold">
                        {grindLabel}
                      </span>
                      <span>{log.grindSize} clicks</span>
                    </span>
                  ) : (
                    "未設定"
                  )}
                </span>
              </div>

              {log.tempType === "ice" && (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5 text-blue-700 animate-in fade-in duration-300">
                    <span className="flex items-center">
                      <span>🧊</span> <span className="ml-1">氷の量</span>
                    </span>
                    <span className="font-bold">
                      {log.iceAmount !== null ? `${log.iceAmount} g` : "未設定"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5 text-blue-700 animate-in fade-in duration-300">
                    <span className="flex items-center">
                      <span>🥛</span> <span className="ml-1">仕上がり量</span>
                    </span>
                    <span className="font-bold">
                      {log.yieldAmount !== null ? `${log.yieldAmount} ml` : "未設定"}
                    </span>
                  </div>
                </>
              )}

              {log.tempType === "hot" && log.yieldAmount !== null && (
                <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                  <span className="text-coffee-secondary">仕上がり量</span>
                  <span className="font-semibold text-coffee-text">{log.yieldAmount} ml</span>
                </div>
              )}

              {log.bloomingTime !== null && (
                <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                  <span className="text-coffee-secondary">蒸らし時間</span>
                  <span className="font-semibold text-coffee-text">{log.bloomingTime} 秒</span>
                </div>
              )}

              {log.drawdownTime !== null && (
                <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                  <span className="text-coffee-secondary">落ち切り時間</span>
                  <span className="font-semibold text-coffee-text">
                    {log.drawdownTime < 60
                      ? `${log.drawdownTime}秒`
                      : `${Math.floor(log.drawdownTime / 60)}分${log.drawdownTime % 60 === 0 ? "" : `${log.drawdownTime % 60}秒`}`}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                <span className="text-coffee-secondary">加水</span>
                <span className="font-semibold text-coffee-text">
                  {log.hasBypass ? "あり" : "なし"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-coffee-secondary/5">
                <span className="text-coffee-secondary">抽出日</span>
                <span className="font-semibold text-coffee-text flex items-center">
                  <Calendar size={14} className="mr-1 text-coffee-secondary" />
                  {getBrewDateDisplay(log)}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Pours Recipe Timeline */}
          {log.pours && log.pours.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-coffee-secondary/10">
              <h4 className="text-xs font-bold text-coffee-secondary uppercase tracking-wider flex items-center">
                注ぎ方レシピ・タイムライン
              </h4>

              <div className="relative border-l border-coffee-primary/20 ml-2.5 pl-4 space-y-3.5 py-2">
                {log.pours.map((pour, index) => (
                  <div key={pour.id} className="space-y-1.5 animate-in fade-in duration-300">
                    <div className="relative group">
                      <span
                        className={cn(
                          "absolute -left-[22px] top-1.5 flex h-3 w-3 rounded-full border-2 bg-white",
                          pour.pourType === "all"
                            ? "border-orange-500"
                            : pour.pourType === "center_around"
                              ? "border-amber-500"
                              : "border-yellow-500",
                        )}
                      />

                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-coffee-primary block">
                            {pour.pourNumber}投目
                            {pour.pourNumber === 1 && log.bloomingTime && (
                              <span className="inline-block bg-amber-100 text-amber-800 border border-amber-200/50 px-1 py-0.5 rounded text-[8px] font-black ml-1.5 align-middle leading-none">
                                蒸らし
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-white leading-none",
                              pour.pourType === "all"
                                ? "bg-orange-500"
                                : pour.pourType === "center_around"
                                  ? "bg-amber-500"
                                  : "bg-yellow-500",
                            )}
                          >
                            {pour.pourType === "all" && "全体に"}
                            {pour.pourType === "center_around" && "中心付近"}
                            {pour.pourType === "center_only" && "中心のみ"}
                          </span>
                        </div>

                        <div className="text-right space-y-0.5">
                          <span className="text-sm font-bold text-coffee-text block">
                            {pour.waterAmount} ml
                          </span>
                        </div>
                      </div>
                    </div>

                    {index < log.pours.length - 1 && (
                      <div className="relative py-0 select-none">
                        {index === 0 ? (
                          <div className="text-[10px] text-coffee-secondary/70 font-medium flex items-center gap-1.5">
                            <span>⏱️ {pour.duration} 秒</span>
                            <span className="inline-block bg-gray-500 text-white px-1.5 py-0.5 rounded text-[8px] font-bold leading-none">
                              蒸らし
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-coffee-secondary/70 font-medium flex items-center gap-1">
                            ⏱️ {pour.duration} 秒
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {log.drawdownTime !== null && (
                  <div className="relative group animate-in fade-in duration-300 pt-2">
                    <span className="absolute -left-[24px] top-[18px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber-600 bg-amber-600 text-white shadow-sm shadow-amber-600/20">
                      <Check size={8} strokeWidth={4} />
                    </span>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50/30 p-3.5 rounded-2xl border border-amber-100 flex justify-between items-center shadow-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-amber-800 block flex items-center gap-1">
                          <span>🏁</span> 落ち切り
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-amber-600 leading-none">
                          ドリップ完了
                        </span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-amber-700/80 font-bold block">
                          総注水量 {log.waterAmount} ml
                        </span>
                        <span className="text-lg font-black text-amber-950 block tracking-tight">
                          ⏱️{" "}
                          {log.drawdownTime < 60
                            ? `${log.drawdownTime}秒`
                            : `${Math.floor(log.drawdownTime / 60)}分${log.drawdownTime % 60 === 0 ? "" : `${log.drawdownTime % 60}秒`}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Card */}
          {log.note && (
            <div className="bg-coffee-background p-4 rounded-2xl border border-coffee-secondary/10 space-y-1.5">
              <span className="text-[10px] font-bold text-coffee-secondary flex items-center uppercase tracking-wider">
                <Info size={12} className="mr-1" /> テイスティングノート
              </span>
              <p className="text-sm text-coffee-text leading-relaxed whitespace-pre-wrap">
                {log.note}
              </p>
            </div>
          )}

          {/* Brewed by info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-coffee-secondary/5 text-xs text-coffee-secondary">
            <span className="flex items-center">
              <User size={12} className="mr-1" /> 淹れた人
            </span>
            <span className="font-semibold text-coffee-text flex items-center space-x-1.5">
              {log.user.avatarUrl && (
                <img
                  src={log.user.avatarUrl}
                  alt={log.user.displayName}
                  className="h-4 w-4 rounded-full object-cover"
                />
              )}
              <span>{log.user.displayName}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Simple loader icon since lucide might lack it or we want safe loading
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

export default LogDetail;
