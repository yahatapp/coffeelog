import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type PageLayoutProps = HTMLAttributes<HTMLDivElement> & {
  readonly children: ReactNode;
};

export function PageLayout({ children, className, ...props }: PageLayoutProps) {
  return (
    <div className={cn("mx-auto w-full max-w-md px-4 pb-24", className)} {...props}>
      {children}
    </div>
  );
}
