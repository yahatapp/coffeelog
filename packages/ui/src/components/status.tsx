import styles from "./status.module.css";
import { Button } from "./button";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type LoadingProps = {
  readonly label?: ReactNode;
  readonly className?: string;
};

export function Loading({ label = "読み込み中...", className }: LoadingProps) {
  return (
    <div role="status" aria-live="polite" className={cn(styles.loading, className)}>
      <span aria-hidden="true" className={styles.spinner} />
      <span className={styles.text}>{label}</span>
    </div>
  );
}

export type ErrorStateProps = {
  readonly message?: ReactNode;
  readonly onRetry?: () => void;
  readonly className?: string;
};

export function ErrorState({
  message = "データの取得に失敗しました。",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn(styles.error, className)}>
      <p className={styles.title}>{message}</p>
      {onRetry && (
        <Button type="button" onClick={onRetry} className={styles.retry}>
          再試行
        </Button>
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
    <div className={cn(styles.empty, className)}>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
