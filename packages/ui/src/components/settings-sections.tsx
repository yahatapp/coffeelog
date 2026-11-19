import type { ReactNode } from "react";
import { Card, CardContent } from "./card";
import styles from "./settings-sections.module.css";

type SettingsProfileProps = {
  profile: { displayName: string; pictureUrl?: string } | null;
  fallbackIcon: ReactNode;
};

export function SettingsProfile({ profile, fallbackIcon }: SettingsProfileProps) {
  return (
    <Card>
      <CardContent>
        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">
            {profile?.pictureUrl ? (
              <img src={profile.pictureUrl} alt="" className={styles.avatarImage} />
            ) : (
              fallbackIcon
            )}
          </div>
          <div className={styles.profileText}>
            <h3 className={styles.name}>{profile?.displayName || "ゲストユーザー"}</h3>
            {profile && <p className={styles.caption}>LINE連携済み</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type SettingsAboutProps = {
  appName: "Brewlog" | "Cafelog";
  onLogout: () => void;
  logoutIcon: ReactNode;
  logoutLabel?: string;
};

export function SettingsAbout({
  appName,
  onLogout,
  logoutIcon,
  logoutLabel = "ログアウト",
}: SettingsAboutProps) {
  return (
    <section className={styles.about}>
      <h3 className={styles.caption}>アプリについて</h3>
      <Card>
        <ul className={styles.menu} role="list">
          {["利用規約", "プライバシーポリシー"].map((label) => (
            <li className={styles.item} key={label}>
              <button className={styles.action} type="button" disabled>
                {label}
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
          <li className={styles.item}>
            <button
              className={`${styles.action} ${styles.logout}`}
              type="button"
              onClick={onLogout}
            >
              {logoutIcon}
              {logoutLabel}
            </button>
          </li>
        </ul>
      </Card>
      <p className={styles.version}>{appName} v0.1.0</p>
    </section>
  );
}
