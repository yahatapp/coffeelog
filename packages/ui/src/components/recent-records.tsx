import { Slot, Slottable } from "@radix-ui/react-slot";
import type { ReactElement, ReactNode } from "react";
import styles from "./recent-records.module.css";

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
