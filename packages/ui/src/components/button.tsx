import styles from "./button.module.css";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

const variants = {
  primary: styles.primary,
  danger: styles.danger,
  secondary: styles.secondary,
  outline: styles.outline,
  ghost: styles.ghost,
} as const;
const sizes = { sm: styles.small, md: styles.medium, lg: styles.large, icon: styles.icon } as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          styles.root,
          variants[variant],
          sizes[size],
          fullWidth && styles.fullWidth,
          className,
        )}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        disabled={asChild ? undefined : disabled || loading}
        ref={ref}
        {...props}
        onClick={(event) => {
          if (disabled || loading) {
            event.preventDefault();
            return;
          }
          props.onClick?.(event);
        }}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { cn };
