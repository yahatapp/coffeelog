import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";
import styles from "./chip.module.css";

type ChipVariant = "filled" | "outline";
type ChipTone = "neutral" | "hot" | "iced" | "warning";
type ChipTextSize = "helper" | "caption";

export type ChipProps = ComponentProps<"span"> & {
  variant?: ChipVariant;
  tone?: ChipTone;
  textSize?: ChipTextSize;
};
type ChipAction = Pick<ChipProps, "variant" | "textSize"> & { children: ReactNode };

export function Chip({
  variant = "filled",
  tone = "neutral",
  textSize = "helper",
  className,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        styles.chip,
        styles[variant],
        styles[tone],
        textSize === "caption" && styles.caption,
        className,
      )}
      {...props}
    />
  );
}

export function ChipButton({
  variant,
  textSize,
  children,
  type = "button",
  className,
  ...props
}: ComponentProps<"button"> & ChipAction) {
  return (
    <button type={type} className={cn(styles.action, className)} {...props}>
      <Chip variant={variant} textSize={textSize}>
        {children}
      </Chip>
    </button>
  );
}

export function ChipLink({
  variant,
  textSize,
  children,
  className,
  ...props
}: ComponentProps<"a"> & ChipAction & { href: string }) {
  return (
    <a className={cn(styles.action, className)} {...props}>
      <Chip variant={variant} textSize={textSize}>
        {children}
      </Chip>
    </a>
  );
}
