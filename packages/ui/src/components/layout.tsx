import styles from "./layout.module.css";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type PageLayoutProps = HTMLAttributes<HTMLDivElement> & {
  readonly children: ReactNode;
};

export function PageLayout({ children, className, ...props }: PageLayoutProps) {
  return (
    <div className={cn(styles.root, className)} {...props}>
      {children}
    </div>
  );
}
