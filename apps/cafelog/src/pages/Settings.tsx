import { useLiff } from "@/hooks/useLiff";
import { User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SettingsAbout,
  SettingsProfile,
} from "@yahatapp/ui";
import { analytics } from "@/lib/analytics";
import styles from "./content.module.css";
const SettingsPage = () => {
  const { profile, relogin } = useLiff();
  const analyticsConsent = analytics.getConsent();
  const isAnalyticsEnabled = analyticsConsent === "enabled";
  return (
    <div className={styles.page}>
      <header className={styles.titleRow}>
        <User size={24} aria-hidden="true" />
        <h2 className={styles.heading}>設定</h2>
      </header>
      <SettingsProfile profile={profile} fallbackIcon={<User size={32} />} />
      <Link to="/stores" className={styles.recordLink}>
        <span>お店・コーヒー記録</span>
        <span aria-hidden="true"> ›</span>
      </Link>
      {analytics.configured && (
        <Card>
          <CardHeader>
            <CardTitle>利用状況の計測</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.section}>
              <p className={styles.muted}>
                {analytics.servicesLabel}
                による利用状況の計測を、改善のために利用します。入力内容やLINE
                IDをイベントとして送信しません。
              </p>
              <p className={styles.muted}>
                現在:{" "}
                {isAnalyticsEnabled
                  ? "許可中"
                  : analyticsConsent === "disabled"
                    ? "停止中"
                    : "未選択"}
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
            </div>
          </CardContent>
        </Card>
      )}
      <SettingsAbout
        appName="Cafelog"
        onLogout={relogin}
        logoutLabel="ログアウト / 再ログイン"
        logoutIcon={<LogOut size={16} aria-hidden="true" />}
      />
    </div>
  );
};
export default SettingsPage;
