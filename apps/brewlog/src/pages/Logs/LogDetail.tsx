import { Loading, ErrorState } from "@yahatapp/ui";
import styles from "../content.module.css";
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
import { Card } from "../../components/ui/card";
import { OriginFlag } from "../../components/ui/OriginFlag";
const LogDetail = () => {
  const { id } = useParams<{
    id: string;
  }>();
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
    return <Loading className={styles.state} />;
  }
  if (logQuery.isError) {
    return (
      <div className={[styles.roomy, styles.center, styles.muted].join(" ")}>
        <ErrorState
          message={<>抽出記録の取得に失敗しました。</>}
          onRetry={() => void logQuery.refetch()}
        />
      </div>
    );
  }
  if (!log) {
    return (
      <div className={[styles.roomy, styles.center].join(" ")}>
        <p className={styles.muted}>記録が見つかりませんでした。</p>
        <Button onClick={() => navigate("/logs")} type="button">
          履歴に戻る
        </Button>
      </div>
    );
  }
  const grindLabel = getGrindLabel(log.grindSize, log.grinder);
  return (
    <div className={styles.stack}>
      <div className={[styles.row, styles.spread].join(" ")}>
        <div className={styles.row}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/logs")}
            type="button"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>抽出記録詳細</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/logs/${log.id}/edit`)}
          type="button"
        >
          <Edit2 size={14} /> 編集
        </Button>
      </div>

      {/* Main Coffee Card */}
      <Card>
        <div className={[styles.tonal, styles.border, styles.content].join(" ")}>
          <span className={[styles.helper, styles.strong, styles.muted].join(" ")}>コーヒー豆</span>
          <div className={[styles.row, styles.spread, styles.separated].join(" ")}>
            <button
              type="button"
              onClick={() => navigate(`/beans/${log.bean.id}`)}
              className={[styles.tonal, styles.rounded, styles.compact, styles.grow].join(" ")}
              aria-label={`${log.bean.name}の詳細を見る`}
            >
              <h3 className={[styles.heading, styles.strong, styles.accent].join(" ")}>
                {log.bean.name}
                <ChevronRight size={16} aria-hidden="true" />
              </h3>
              <div className={styles.separated}>
                {log.bean.origin && (
                  <div className={styles.row}>
                    <span className={[styles.helper, styles.muted].join(" ")}>産地:</span>
                    <OriginFlag origin={log.bean.origin} size="sm" />
                    <span className={[styles.helper, styles.muted].join(" ")}>
                      {log.bean.origin}
                    </span>
                  </div>
                )}
              </div>
            </button>
            <div className={styles.stack}>
              {log.rating && (
                <div
                  className={[styles.warningPanel, styles.border, styles.rounded, styles.row].join(
                    " ",
                  )}
                >
                  <Star
                    size={14}
                    className={[styles.warningText, styles.ratingFilled, styles.icon].join(" ")}
                  />
                  <span className={[styles.body, styles.strong, styles.warningText].join(" ")}>
                    {log.rating}
                  </span>
                </div>
              )}
              {log.tempType === "ice" ? (
                <span
                  className={[
                    styles.icedPanel,
                    styles.border,
                    styles.rounded,
                    styles.elevated,
                    styles.row,
                    styles.center,
                    styles.body,
                    styles.icedText,
                  ].join(" ")}
                >
                  ❄️
                </span>
              ) : (
                <span
                  className={[
                    styles.hotPanel,
                    styles.border,
                    styles.rounded,
                    styles.elevated,
                    styles.row,
                    styles.center,
                    styles.body,
                    styles.hotText,
                  ].join(" ")}
                >
                  ☕
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={[styles.roomy, styles.stack].join(" ")}>
          {/* Summary Row */}
          <div className={[styles.metrics, styles.center].join(" ")}>
            <div
              className={[styles.tonal, styles.border, styles.rounded, styles.compact].join(" ")}
            >
              <div
                className={[styles.row, styles.center, styles.muted, styles.separated].join(" ")}
              >
                <Thermometer size={18} />
              </div>
              <span className={[styles.helper, styles.muted].join(" ")}>湯温</span>
              <span className={[styles.strong, styles.foreground].join(" ")}>
                {log.waterTemp ? `${log.waterTemp}℃` : "---"}
              </span>
            </div>
            <div
              className={[styles.tonal, styles.border, styles.rounded, styles.compact].join(" ")}
            >
              <div
                className={[styles.row, styles.center, styles.muted, styles.separated].join(" ")}
              >
                <Scale size={18} />
              </div>
              <span className={[styles.helper, styles.muted].join(" ")}>豆量</span>
              <span className={[styles.strong, styles.foreground].join(" ")}>
                {log.beanAmount ? `${log.beanAmount}g` : "---"}
              </span>
            </div>
            <div
              className={[styles.tonal, styles.border, styles.rounded, styles.compact].join(" ")}
            >
              <div
                className={[styles.row, styles.center, styles.muted, styles.separated].join(" ")}
              >
                <Droplet size={18} />
              </div>
              <span className={[styles.helper, styles.muted].join(" ")}>注水量</span>
              <span className={[styles.strong, styles.foreground].join(" ")}>
                {log.waterAmount ? `${log.waterAmount}ml` : "---"}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className={[styles.border, styles.stack, styles.separated].join(" ")}>
            <h4 className={[styles.helper, styles.strong, styles.muted].join(" ")}>
              抽出レシピ詳細
            </h4>

            <div className={[styles.fieldStack, styles.body].join(" ")}>
              <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                <span className={styles.muted}>抽出器具 / 方法</span>
                <span className={[styles.strong, styles.foreground].join(" ")}>
                  {log.dripper?.name || log.method || "未設定"}
                  {log.dripper && log.method && (
                    <span className={[styles.helper, styles.muted].join(" ")}>({log.method})</span>
                  )}
                </span>
              </div>

              <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                <span className={styles.muted}>グラインダー</span>
                <span className={[styles.strong, styles.foreground].join(" ")}>
                  {log.grinder?.name || "未設定"}
                </span>
              </div>

              <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                <span className={styles.muted}>挽き目 (クリック数)</span>
                <span className={[styles.strong, styles.foreground].join(" ")}>
                  {log.grindSize !== null ? (
                    <span className={styles.row}>
                      <span
                        className={[
                          styles.tonal,
                          styles.pill,
                          styles.helper,
                          styles.strong,
                          styles.accent,
                        ].join(" ")}
                      >
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
                  <div
                    className={[styles.border, styles.row, styles.spread, styles.icedText].join(
                      " ",
                    )}
                  >
                    <span className={styles.row}>
                      <span>🧊</span> <span>氷の量</span>
                    </span>
                    <span className={styles.strong}>
                      {log.iceAmount !== null ? `${log.iceAmount} g` : "未設定"}
                    </span>
                  </div>
                  <div
                    className={[styles.border, styles.row, styles.spread, styles.icedText].join(
                      " ",
                    )}
                  >
                    <span className={styles.row}>
                      <span>🥛</span> <span>仕上がり量</span>
                    </span>
                    <span className={styles.strong}>
                      {log.yieldAmount !== null ? `${log.yieldAmount} ml` : "未設定"}
                    </span>
                  </div>
                </>
              )}

              {log.tempType === "hot" && log.yieldAmount !== null && (
                <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                  <span className={styles.muted}>仕上がり量</span>
                  <span className={[styles.strong, styles.foreground].join(" ")}>
                    {log.yieldAmount} ml
                  </span>
                </div>
              )}

              {log.bloomingTime !== null && (
                <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                  <span className={styles.muted}>蒸らし時間</span>
                  <span className={[styles.strong, styles.foreground].join(" ")}>
                    {log.bloomingTime} 秒
                  </span>
                </div>
              )}

              {log.drawdownTime !== null && (
                <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                  <span className={styles.muted}>落ち切り時間</span>
                  <span className={[styles.strong, styles.foreground].join(" ")}>
                    {log.drawdownTime < 60
                      ? `${log.drawdownTime}秒`
                      : `${Math.floor(log.drawdownTime / 60)}分${log.drawdownTime % 60 === 0 ? "" : `${log.drawdownTime % 60}秒`}`}
                  </span>
                </div>
              )}

              <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                <span className={styles.muted}>加水</span>
                <span className={[styles.strong, styles.foreground].join(" ")}>
                  {log.hasBypass ? "あり" : "なし"}
                </span>
              </div>

              <div className={[styles.border, styles.row, styles.spread].join(" ")}>
                <span className={styles.muted}>抽出日</span>
                <span className={[styles.row, styles.strong, styles.foreground].join(" ")}>
                  <Calendar size={14} className={styles.muted} />
                  {getBrewDateDisplay(log)}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Pours Recipe Timeline */}
          {log.pours && log.pours.length > 0 && (
            <div className={[styles.border, styles.stack, styles.separated].join(" ")}>
              <h4 className={[styles.row, styles.helper, styles.strong, styles.muted].join(" ")}>
                注ぎ方レシピ・タイムライン
              </h4>

              <div className={[styles.border, styles.fieldStack, styles.relative].join(" ")}>
                {log.pours.map((pour, index) => (
                  <div key={pour.id} className={styles.fieldStack}>
                    <div className={styles.relative}>
                      <span
                        className={cn(
                          [
                            styles.surface,
                            styles.border,
                            styles.pill,
                            styles.row,
                            styles.absolute,
                          ].join(" "),
                          pour.pourType === "all"
                            ? styles.border
                            : pour.pourType === "center_around"
                              ? styles.border
                              : styles.border,
                        )}
                      />

                      <div className={[styles.row, styles.spread, styles.start].join(" ")}>
                        <div className={styles.fieldStack}>
                          <span className={[styles.helper, styles.strong, styles.accent].join(" ")}>
                            {pour.pourNumber}投目
                            {pour.pourNumber === 1 && log.bloomingTime && (
                              <span
                                className={[
                                  styles.warningPanel,
                                  styles.border,
                                  styles.rounded,
                                  styles.helper,
                                  styles.strong,
                                  styles.warningText,
                                ].join(" ")}
                              >
                                蒸らし
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              [
                                styles.rounded,
                                styles.helper,
                                styles.strong,
                                styles.warningText,
                              ].join(" "),
                              pour.pourType === "all"
                                ? styles.hotPanel
                                : pour.pourType === "center_around"
                                  ? styles.warningPanel
                                  : styles.warningPanel,
                            )}
                          >
                            {pour.pourType === "all" && "全体に"}
                            {pour.pourType === "center_around" && "中心付近"}
                            {pour.pourType === "center_only" && "中心のみ"}
                          </span>
                        </div>

                        <div className={[styles.fieldStack, styles.end].join(" ")}>
                          <span
                            className={[styles.body, styles.strong, styles.foreground].join(" ")}
                          >
                            {pour.waterAmount} ml
                          </span>
                        </div>
                      </div>
                    </div>

                    {index < log.pours.length - 1 && (
                      <div className={styles.relative}>
                        {index === 0 ? (
                          <div className={[styles.row, styles.helper, styles.muted].join(" ")}>
                            <span>⏱️ {pour.duration} 秒</span>
                            <span
                              className={[
                                styles.rounded,
                                styles.helper,
                                styles.strong,
                                styles.warningText,
                              ].join(" ")}
                            >
                              蒸らし
                            </span>
                          </div>
                        ) : (
                          <div className={[styles.row, styles.helper, styles.muted].join(" ")}>
                            ⏱️ {pour.duration} 秒
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {log.drawdownTime !== null && (
                  <div className={[styles.relative, styles.separated].join(" ")}>
                    <span
                      className={[
                        styles.warningPanel,
                        styles.border,
                        styles.pill,
                        styles.elevated,
                        styles.row,
                        styles.center,
                        styles.warningText,
                        styles.absolute,
                      ].join(" ")}
                    >
                      <Check size={8} strokeWidth={4} />
                    </span>

                    <div
                      className={[
                        styles.border,
                        styles.rounded,
                        styles.elevated,
                        styles.compact,
                        styles.row,
                        styles.spread,
                      ].join(" ")}
                    >
                      <div className={styles.fieldStack}>
                        <span
                          className={[
                            styles.row,
                            styles.helper,
                            styles.strong,
                            styles.warningText,
                          ].join(" ")}
                        >
                          <span>🏁</span> 落ち切り
                        </span>
                        <span
                          className={[
                            styles.warningPanel,
                            styles.rounded,
                            styles.helper,
                            styles.strong,
                            styles.warningText,
                          ].join(" ")}
                        >
                          ドリップ完了
                        </span>
                      </div>

                      <div className={[styles.fieldStack, styles.end].join(" ")}>
                        <span
                          className={[styles.helper, styles.strong, styles.warningText].join(" ")}
                        >
                          総注水量 {log.waterAmount} ml
                        </span>
                        <span
                          className={[styles.heading, styles.strong, styles.warningText].join(" ")}
                        >
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

          {log.brewComment && (
            <div
              className={[
                styles.tonal,
                styles.border,
                styles.rounded,
                styles.content,
                styles.fieldStack,
              ].join(" ")}
            >
              <span className={[styles.row, styles.helper, styles.strong, styles.muted].join(" ")}>
                <Info size={12} /> 抽出コメント
              </span>
              <p className={[styles.body, styles.foreground, styles.multiline].join(" ")}>
                {log.brewComment}
              </p>
            </div>
          )}

          {/* Notes Card */}
          {log.note && (
            <div
              className={[
                styles.tonal,
                styles.border,
                styles.rounded,
                styles.content,
                styles.fieldStack,
              ].join(" ")}
            >
              <span className={[styles.row, styles.helper, styles.strong, styles.muted].join(" ")}>
                <Info size={12} /> テイスティングノート
              </span>
              <p className={[styles.body, styles.foreground, styles.multiline].join(" ")}>
                {log.note}
              </p>
            </div>
          )}

          {/* Brewed by info */}
          <div
            className={[
              styles.tonal,
              styles.rounded,
              styles.compact,
              styles.row,
              styles.spread,
              styles.helper,
              styles.muted,
            ].join(" ")}
          >
            <span className={styles.row}>
              <User size={12} /> 淹れた人
            </span>
            <span className={[styles.row, styles.strong, styles.foreground].join(" ")}>
              {log.user.avatarUrl && (
                <img
                  src={log.user.avatarUrl}
                  alt={log.user.displayName}
                  className={[styles.pill, styles.icon].join(" ")}
                />
              )}
              <span>{log.user.displayName}</span>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Simple loader icon since lucide might lack it or we want safe loading
export default LogDetail;
