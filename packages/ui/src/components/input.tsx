import styles from "./input.module.css";
import * as React from "react";
import { cn } from "../lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(styles.root, className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
