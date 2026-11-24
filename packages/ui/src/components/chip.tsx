import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";
import styles from "./chip.module.css";

type ChipVariant = "filled" | "outline";
type ChipTone = "neutral" | "hot" | "iced" | "warning";

export type ChipProps = ComponentProps<"span"> & { variant?: ChipVariant; tone?: ChipTone };
type ChipAction = { children: ReactNode; variant?: ChipVariant };

export function Chip({ variant = "filled", tone = "neutral", className, ...props }: ChipProps) {
  return <span className={cn(styles.chip, styles[variant], styles[tone], className)} {...props} />;
}

export function ChipButton({
  variant,
  children,
  type = "button",
  className,
  ...props
}: ComponentProps<"button"> & ChipAction) {
  return (
    <button type={type} className={cn(styles.action, className)} {...props}>
      <Chip variant={variant}>{children}</Chip>
    </button>
  );
}

export function ChipLink({
  variant,
  children,
  className,
  ...props
}: ComponentProps<"a"> & ChipAction & { href: string }) {
  return (
    <a className={cn(styles.action, className)} {...props}>
      <Chip variant={variant}>{children}</Chip>
    </a>
  );
}
