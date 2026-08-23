import * as React from "react";
import { cn } from "../lib/cn";

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "checkbox", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0",
      className,
    )}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";
