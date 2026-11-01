import { ErrorState, Loading } from "@yahatapp/ui";
import styles from "./content.module.css";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, ChevronRight, Settings2 } from "lucide-react";
import { useLiff } from "../hooks/useLiff";
import { Card } from "../components/ui/card";
import { dripperQueries, grinderQueries } from "@/lib/queries";
import { analytics } from "@/lib/analytics";
const Settings = () => {
  const { profile, liff } = useLiff();
  const navigate = useNavigate();
  const drippersQuery = useQuery(dripperQueries.all());
  const grindersQuery = useQuery(grinderQueries.all());
  const drippers = drippersQuery.data ?? [];
  const grinders = grindersQuery.data ?? [];
  const isLoading = drippersQuery.isPending || grindersQuery.isPending;
  const analyticsConsent = analytics.getConsent();
  const isAnalyticsEnabled = analyticsConsent === "enabled";
  const handleLogout = () => {
    if (liff?.isLoggedIn()) {
      liff.logout();
      window.location.reload();
    }
  };
  return (
    <div className={[styles.stack, styles.separated].join(" ")}>
      <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>設定</h2>

      {/* User profile */}
      <Card>
        <div className={[styles.roomy, styles.row].join(" ")}>
          <div
            className={[
              styles.avatar,
              styles.tonal,
              styles.border,
              styles.pill,
              styles.elevated,
              styles.clipped,
            ].join(" ")}
          >
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className={styles.avatarImage}
              />
            ) : (
              <div className={[styles.row, styles.center, styles.fullWidth].join(" ")}>
                <User size={32} className={styles.muted} />
              </div>
            )}
          </div>
          <div>
            <p className={[styles.heading, styles.strong, styles.accent].join(" ")}>
              {profile?.displayName || "ゲストユーザー"}
            </p>
            <p className={[styles.helper, styles.muted].join(" ")}>LINE連携済み</p>
          </div>
        </div>
      </Card>

      {isLoading && <Loading label="器具を読み込み中" />}
      {(drippersQuery.isError || grindersQuery.isError) && (
        <ErrorState
          message="器具一覧を取得できませんでした。"
          onRetry={() => {
            void drippersQuery.refetch();
            void grindersQuery.refetch();
          }}
        />
      )}
      {/* Equipment manager section */}
      <section className={styles.fieldStack}>
        <div className={styles.row}>
          <Settings2 size={16} className={styles.accent} />
          <h3 className={[styles.body, styles.strong, styles.accent].join(" ")}>器具マスタ管理</h3>
        </div>
        <Card>
          <div className={styles.divided}>
            <button
              onClick={() => navigate("/settings/drippers")}
              className={[
                styles.tonal,
                styles.content,
                styles.row,
                styles.spread,
                styles.fullWidth,
                styles.body,
              ].join(" ")}
              type="button"
            >
              <span className={styles.foreground}>ドリッパー管理</span>
              <div className={styles.row}>
                <span
                  className={[
                    styles.tonal,
                    styles.border,
                    styles.pill,
                    styles.helper,
                    styles.muted,
                  ].join(" ")}
                >
                  {isLoading ? "-" : drippers.length}個
                </span>
                <ChevronRight size={16} className={styles.muted} />
              </div>
            </button>
            <button
              onClick={() => navigate("/settings/grinders")}
              className={[
                styles.tonal,
                styles.content,
                styles.row,
                styles.spread,
                styles.fullWidth,
                styles.body,
              ].join(" ")}
              type="button"
            >
              <span className={styles.foreground}>グラインダー管理</span>
              <div className={styles.row}>
                <span
                  className={[
                    styles.tonal,
                    styles.border,
                    styles.pill,
                    styles.helper,
                    styles.muted,
                  ].join(" ")}
                >
                  {isLoading ? "-" : grinders.length}個
                </span>
                <ChevronRight size={16} className={styles.muted} />
              </div>
            </button>
          </div>
        </Card>
      </section>

      <Link
        to="/stores"
        className={[
          styles.surface,
          styles.border,
          styles.rounded,
          styles.elevated,
          styles.content,
          styles.row,
          styles.spread,
          styles.body,
          styles.strong,
          styles.accent,
          styles.selected,
        ].join(" ")}
      >
        <span>お店・コーヒー記録</span>
        <span aria-hidden="true">›</span>
      </Link>

      {analytics.configured && (
        <section
          className={[styles.surface, styles.border, styles.rounded, styles.content].join(" ")}
        >
          <h3 className={[styles.body, styles.strong, styles.accent].join(" ")}>利用状況の計測</h3>
          <p className={[styles.helper, styles.muted, styles.separated].join(" ")}>
            {analytics.servicesLabel}
            による利用状況の計測を、改善のために利用します。入力内容やLINE
            IDをイベントとして送信しません。
          </p>
          <p className={[styles.helper, styles.muted, styles.separated].join(" ")}>
            現在:{" "}
            {isAnalyticsEnabled ? "許可中" : analyticsConsent === "disabled" ? "停止中" : "未選択"}
          </p>
          <button
            type="button"
            className={[
              [
                styles.rounded,
                styles.fullWidth,
                styles.target,
                styles.body,
                styles.strong,
                styles.separated,
              ].join(" "),
              isAnalyticsEnabled
                ? [styles.border, styles.foreground].join(" ")
                : [styles.primaryBadge, styles.onPrimary].join(" "),
            ].join(" ")}
            onClick={() => analytics.setConsent(isAnalyticsEnabled ? "disabled" : "enabled")}
            aria-pressed={isAnalyticsEnabled}
          >
            {isAnalyticsEnabled ? "計測を停止する" : "計測を許可する"}
          </button>
        </section>
      )}

      {/* About and logout */}
      <section className={[styles.fieldStack, styles.separated].join(" ")}>
        <h3 className={[styles.helper, styles.strong, styles.muted].join(" ")}>アプリについて</h3>
        <Card>
          <div className={styles.divided}>
            <button
              className={[
                styles.tonal,
                styles.content,
                styles.row,
                styles.spread,
                styles.fullWidth,
                styles.body,
              ].join(" ")}
              type="button"
            >
              <span className={styles.foreground}>利用規約</span>
              <ChevronRight size={16} className={styles.muted} />
            </button>
            <button
              className={[
                styles.tonal,
                styles.content,
                styles.row,
                styles.spread,
                styles.fullWidth,
                styles.body,
              ].join(" ")}
              type="button"
            >
              <span className={styles.foreground}>プライバシーポリシー</span>
              <ChevronRight size={16} className={styles.muted} />
            </button>
            <button
              onClick={handleLogout}
              className={[
                styles.errorPanel,
                styles.content,
                styles.row,
                styles.fullWidth,
                styles.body,
                styles.dangerText,
              ].join(" ")}
              type="button"
            >
              <LogOut size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        </Card>
      </section>

      <div className={styles.center}>
        <p className={[styles.helper, styles.muted].join(" ")}>Brewlog v0.1.0</p>
      </div>
    </div>
  );
};
export default Settings;
