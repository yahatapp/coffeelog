import { Slot, Slottable } from "@radix-ui/react-slot";
import type { ReactElement, ReactNode } from "react";
import { Button } from "./button";
import { CardHeader, CardTitle } from "./card";
import styles from "./recent-records.module.css";

export function RecentRecordsHeader({ title, action }: { title: string; action?: ReactElement }) {
  return (
    <CardHeader>
      <div className={styles.header}>
        <CardTitle>{title}</CardTitle>
        {action && (
          <div className={styles.headerAction}>
            <Button asChild variant="ghost" size="sm">
              {action}
            </Button>
          </div>
        )}
      </div>
    </CardHeader>
  );
}

export function RecentRecords({ children }: { children: ReactNode }) {
  return (
    <ul className={styles.list} role="list">
      {children}
    </ul>
  );
}

export function RecentRecord({ children }: { children: ReactElement }) {
  return (
    <li className={styles.item}>
      <Slot className={styles.link}>
        <Slottable>{children}</Slottable>
        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </Slot>
    </li>
  );
}
