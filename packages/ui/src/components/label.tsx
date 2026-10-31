import styles from "./label.module.css";
import * as React from "react";
import { cn } from "../lib/cn";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(styles.root, className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
