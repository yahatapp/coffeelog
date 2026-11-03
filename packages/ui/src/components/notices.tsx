import css from "./notices.module.css";
import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { noticeManager, type NoticeVariant } from "../lib/notices";

const styles = {
  success: css.success,
  warning: css.warning,
  error: css.error,
} satisfies Record<NoticeVariant, string>;

const NoticeIcon = ({ variant }: { variant: NoticeVariant }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={css.icon}
  >
    {variant === "success" ? (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ) : variant === "warning" ? (
      <>
        <path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4m0 4h.01" />
      </>
    ) : (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4m0 4h.01" />
      </>
    )}
  </svg>
);

const NoticeViewport = () => {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="操作結果の通知" className={css.viewport}>
        {toasts.map((toast) => {
          const variant =
            toast.type === "warning" || toast.type === "error" ? toast.type : "success";
          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              swipeDirection={["up", "right"]}
              className={`${css.toast} ${styles[variant]}`}
            >
              <Toast.Content className={css.content}>
                <div className={css.header}>
                  <NoticeIcon variant={variant} />
                  <Toast.Title className={css.title} />
                  <Toast.Close aria-label="通知を閉じる" className={css.close}>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className={css.closeIcon}
                    >
                      <path d="m6 6 12 12M6 18 18 6" />
                    </svg>
                  </Toast.Close>
                </div>
                <Toast.Description className={css.description} />
              </Toast.Content>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
};

export const NoticeProvider = ({ children }: { children: ReactNode }) => (
  <Toast.Provider toastManager={noticeManager} limit={Infinity}>
    {children}
    <NoticeViewport />
  </Toast.Provider>
);
