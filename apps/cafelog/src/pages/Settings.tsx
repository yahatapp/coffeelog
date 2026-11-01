import { useLiff } from "@/hooks/useLiff";
import { User, Copy, Check, Info, LogOut } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, useNotice } from "@yahatapp/ui";
import { analytics } from "@/lib/analytics";
import styles from "./content.module.css";
const SettingsPage = () => {
  const { profile, relogin } = useLiff();
  const [copied, setCopied] = useState(false);
  const { notify } = useNotice();
  const analyticsConsent = analytics.getConsent();
  const isAnalyticsEnabled = analyticsConsent === "enabled";
  const copyToClipboard = async () => {
    if (!profile?.userId) return;
    try {
      await navigator.clipboard.writeText(profile.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify({
        message: "ユーザーIDをコピーできませんでした。もう一度お試しください。",
        variant: "error",
      });
    }
  };
  return (
    <div className={styles.page}>
      <header className={styles.titleRow}>
        <User size={24} aria-hidden="true" />
        <h2 className={styles.heading}>設定</h2>
      </header>
      <Card>
        <CardContent>
          {profile ? (
            <div className={styles.section}>
              <div className={styles.profile}>
                {profile.pictureUrl ? (
                  <img
                    src={profile.pictureUrl}
                    alt={profile.displayName}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    <User size={48} aria-hidden="true" />
                  </div>
                )}
                <h3 className={styles.heading}>{profile.displayName}</h3>
                {profile.statusMessage && (
                  <p className={styles.muted}>「{profile.statusMessage}」</p>
                )}
              </div>
              <section className={styles.section}>
                <h3 className={styles.label}>LINE ユーザーID</h3>
                <div className={styles.identity}>
                  <span className={styles.userId}>{profile.userId}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void copyToClipboard()}
                    aria-label="ユーザーIDをコピー"
                  >
                    {copied ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <Copy size={18} aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className={styles.muted} role="status">
                    ユーザーIDをコピーしました。
                  </p>
                )}
              </section>
            </div>
          ) : (
            <p className={styles.muted}>プロフィール情報が見つかりません。</p>
          )}
        </CardContent>
      </Card>
      <Link to="/stores" className={styles.recordLink}>
        <span>お店・コーヒー記録</span>
        <span aria-hidden="true"> ›</span>
      </Link>
      {analytics.configured && (
        <section className={styles.panel}>
          <h3 className={styles.recordTitle}>利用状況の計測</h3>
          <p className={styles.muted}>
            {analytics.servicesLabel}による利用状況の計測を、改善のために利用します。入力内容やLINE
            IDをイベントとして送信しません。
          </p>
          <p className={styles.muted}>
            現在:{" "}
            {isAnalyticsEnabled ? "許可中" : analyticsConsent === "disabled" ? "停止中" : "未選択"}
          </p>
          <Button
            type="button"
            variant={isAnalyticsEnabled ? "outline" : "primary"}
            fullWidth
            aria-pressed={isAnalyticsEnabled}
            onClick={() => analytics.setConsent(isAnalyticsEnabled ? "disabled" : "enabled")}
          >
            {isAnalyticsEnabled ? "計測を停止する" : "計測を許可する"}
          </Button>
        </section>
      )}
      <Card>
        <CardContent>
          <section className={styles.section}>
            <h3 className={styles.titleRow}>
              <Info size={18} aria-hidden="true" />
              アプリ情報
            </h3>
            <dl className={styles.info}>
              <dt>アプリ名</dt>
              <dd>Cafelog</dd>
              <dt>バージョン</dt>
              <dd>0.1.0</dd>
              <dt>スタック</dt>
              <dd>React + Hono + Workers</dd>
            </dl>
          </section>
        </CardContent>
      </Card>
      <Button type="button" variant="outline" fullWidth onClick={relogin}>
        <LogOut size={18} aria-hidden="true" />
        ログアウト / 再ログイン
      </Button>
    </div>
  );
};
export default SettingsPage;
