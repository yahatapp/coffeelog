import styles from "./checkbox.module.css";
import * as React from "react";
import { cn } from "../lib/cn";

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "checkbox", ...props }, ref) => (
  <span className={styles.target}>
    <input ref={ref} type={type} className={cn(styles.root, className)} {...props} />
    <span className={styles.indicator} aria-hidden="true">
      <svg
        className={styles.check}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    </span>
  </span>
));
Checkbox.displayName = "Checkbox";
