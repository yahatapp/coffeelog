import { useEffect, useState, useSyncExternalStore } from "react";
import { noticeStore, type Notice, type NoticeVariant } from "../lib/notices";

const styles = {
  success: "border-emerald-200 text-emerald-800",
  warning: "border-amber-200 text-amber-800",
  error: "border-red-200 text-red-700",
} satisfies Record<NoticeVariant, string>;

export const FloatingNotice = ({
  message,
  variant = "error",
  onDismiss,
}: {
  message: string;
  variant?: NoticeVariant;
  onDismiss: () => void;
}) => (
  <div
    role={variant === "success" ? "status" : "alert"}
    aria-atomic="true"
    className={`pointer-events-auto mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-top-4 motion-safe:fade-in ${styles[variant]}`}
  >
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
    <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-relaxed">{message}</p>
    <button
      type="button"
      aria-label="通知を閉じる"
      onClick={onDismiss}
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
    </button>
  </div>
);

const NoticeItem = ({ notice }: { notice: Notice }) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (notice.variant !== "success" || hovered || focused) return;
    const timer = window.setTimeout(() => noticeStore.dismiss(notice.id), 5000);
    return () => window.clearTimeout(timer);
  }, [notice.id, notice.variant, hovered, focused]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <FloatingNotice {...notice} onDismiss={() => noticeStore.dismiss(notice.id)} />
    </div>
  );
};

export const NoticeViewport = () => {
  const notices = useSyncExternalStore(noticeStore.subscribe, noticeStore.getSnapshot);
  return (
    <section
      aria-label="操作結果の通知"
      className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] mx-auto max-h-[75dvh] max-w-md space-y-3 overflow-y-auto px-4 pb-4"
    >
      {notices.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </section>
  );
};
