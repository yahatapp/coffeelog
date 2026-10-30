import { AlertCircle, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

export const FloatingNotice = ({
  message,
  warning = false,
}: {
  message: string;
  warning?: boolean;
}) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const Icon = warning ? AlertTriangle : AlertCircle;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] px-4">
      <div
        role="alert"
        aria-atomic="true"
        className={`pointer-events-auto mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-top-4 motion-safe:fade-in ${warning ? "border-amber-200 text-amber-800" : "border-red-200 text-red-700"}`}
      >
        <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
        <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-relaxed">
          {message}
        </p>
        <button
          type="button"
          aria-label="通知を閉じる"
          onClick={() => setDismissed(true)}
          className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
    </div>,
    document.body,
  );
};
