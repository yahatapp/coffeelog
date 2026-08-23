import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type LoadingProps = {
  readonly label?: ReactNode;
  readonly className?: string;
};

export function Loading({ label = "読み込み中...", className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-muted", className)}>
      <span
        aria-hidden="true"
        className="h-7 w-7 animate-spin rounded-full border-2 border-muted/30 border-t-primary"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export type ErrorStateProps = {
  readonly message?: ReactNode;
  readonly onRetry?: () => void;
  readonly className?: string;
};

export function ErrorState({ message = "データの取得に失敗しました。", onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700", className)}>
      <p className="text-sm font-semibold">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl border border-red-200 bg-surface px-4 py-2 text-xs font-bold hover:bg-red-50"
        >
          再試行
        </button>
      )}
    </div>
  );
}

export type EmptyStateProps = {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border bg-surface p-8 text-center", className)}>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
