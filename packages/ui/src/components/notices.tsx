import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { noticeManager, type NoticeVariant } from "../lib/notices";

const styles = {
  success: "border-emerald-200 text-emerald-800",
  warning: "border-amber-200 text-amber-800",
  error: "border-red-200 text-red-700",
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
    className="mt-0.5 size-5 shrink-0"
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
      <Toast.Viewport
        aria-label="操作結果の通知"
        className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] mx-auto flex max-h-[75dvh] max-w-md flex-col gap-3 overflow-y-auto px-4 pb-4 outline-none"
      >
        {toasts.map((toast) => {
          const variant =
            toast.type === "warning" || toast.type === "error" ? toast.type : "success";
          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              swipeDirection={["up", "right"]}
              className={`pointer-events-auto w-full shrink-0 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-current data-[ending-style]:hidden ${styles[variant]}`}
            >
              <Toast.Content className="flex items-start gap-3">
                <NoticeIcon variant={variant} />
                <Toast.Title className="min-w-0 flex-1 break-words text-sm font-semibold leading-relaxed" />
                <Toast.Close
                  aria-label="通知を閉じる"
                  className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="size-[18px]"
                  >
                    <path d="m6 6 12 12M6 18 18 6" />
                  </svg>
                </Toast.Close>
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
