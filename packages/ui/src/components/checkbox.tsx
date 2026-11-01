import styles from "./checkbox.module.css";
import * as React from "react";
import { cn } from "../lib/cn";

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "checkbox", ...props }, ref) => (
  <input ref={ref} type={type} className={cn(styles.root, className)} {...props} />
));
Checkbox.displayName = "Checkbox";
