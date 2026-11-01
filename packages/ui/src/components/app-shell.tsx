import type { ReactNode } from "react";
import { PageLayout } from "./layout";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Loading } from "./status";
import styles from "./app-shell.module.css";
export type NavigationItem = { href: string; label: string; icon: ReactNode; active: boolean };
export type NavigationLinkProps = {
  className: string;
  children: ReactNode;
  "aria-current"?: "page";
};
export type BottomNavigationProps = {
  items: readonly NavigationItem[];
  renderLink: (item: NavigationItem, props: NavigationLinkProps) => ReactNode;
};
export function BottomNavigation({ items, renderLink }: BottomNavigationProps) {
  return (
    <nav aria-label="メインナビゲーション" className={styles.navigation}>
      <ul className={styles.navigationItems}>
        {items.map((item) => (
          <li key={item.href} className={styles.navigationEntry}>
            {renderLink(item, {
              className: styles.navigationLink,
              "aria-current": item.active ? "page" : undefined,
              children: (
                <>
                  <span className={styles.navigationIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={styles.navigationLabel}>{item.label}</span>
                </>
              ),
            })}
          </li>
        ))}
      </ul>
    </nav>
  );
}
export function AppShell({
  children,
  navigation,
  banner,
}: {
  children: ReactNode;
  navigation: ReactNode;
  banner?: ReactNode;
}) {
  return (
    <div className={styles.root} data-clarity-mask="True">
      {banner}
      <main className={styles.main}>
        <PageLayout>{children}</PageLayout>
      </main>
      {navigation}
    </div>
  );
}
export function ConsentNotice({
  servicesLabel,
  onAccept,
  onDecline,
}: {
  servicesLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <aside className={styles.consent} aria-label="利用状況の計測について">
      <h2 className={styles.consentTitle}>利用状況の計測</h2>
      <p className={styles.consentDescription}>
        使いやすさの改善のため、{servicesLabel}
        で画面の利用状況と操作の様子を確認します。入力内容やLINE IDは計測イベントに含めません。
      </p>
      <div className={styles.consentActions}>
        <Button type="button" onClick={onAccept}>
          許可する
        </Button>
        <Button type="button" variant="outline" onClick={onDecline}>
          許可しない
        </Button>
      </div>
      <p className={styles.consentDescription}>設定からいつでも変更できます。</p>
    </aside>
  );
}
export type SessionStateProps =
  | { status: "loading" }
  | { status: "error"; message: string; onRelogin?: () => void };
export function SessionState(props: SessionStateProps) {
  return (
    <div className={styles.session}>
      {props.status === "loading" ? (
        <Loading />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>エラーが発生しました</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.sessionMessage}>{props.message}</p>
            {props.onRelogin && (
              <Button type="button" onClick={props.onRelogin}>
                LINEで再ログイン
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
