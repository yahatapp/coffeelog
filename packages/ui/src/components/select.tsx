import styles from "./select.module.css";
import * as React from "react";
import { cn } from "../lib/cn";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(styles.root, className)}
    {...props}
  />
));
Select.displayName = "Select";
