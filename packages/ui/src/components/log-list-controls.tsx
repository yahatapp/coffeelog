import styles from "./log-list-controls.module.css";
import { cn } from "../lib/cn";
export type LogTemperatureFilter = "all" | "hot" | "iced";
export type LogSortOrder = "asc" | "desc";
export type LogSortOption<T extends string> = {
  value: T;
  label: string;
  initialOrder: LogSortOrder;
  ascendingLabel?: string;
};
export type LogListControlsProps<T extends string> = {
  filter: LogTemperatureFilter;
  counts: Record<LogTemperatureFilter, number>;
  onFilterChange: (filter: LogTemperatureFilter) => void;
  sortBy: T;
  sortOrder: LogSortOrder;
  sortOptions: readonly LogSortOption<T>[];
  onSortChange: (sortBy: T) => void;
  className?: string;
};
const options = [
  { value: "all", label: "すべて" },
  { value: "hot", label: "ホット" },
  { value: "iced", label: "アイス" },
] as const;
export const LogListControls = <T extends string>({
  filter,
  counts,
  onFilterChange,
  sortBy,
  sortOrder,
  sortOptions,
  onSortChange,
  className,
}: LogListControlsProps<T>) => (
  <div className={cn(styles.root, className)}>
    <div className={styles.filters} role="group" aria-label="温度で絞り込む">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={filter === option.value}
          data-temperature={option.value}
          onClick={() => onFilterChange(option.value)}
        >
          {option.value !== "all" && (
            <span aria-hidden="true" className={styles.marker} data-temperature={option.value} />
          )}
          <span>{option.label}</span>
          <span className={styles.count}>{counts[option.value]}</span>
        </button>
      ))}
    </div>
    <div className={styles.sort}>
      <span>ソート:</span>
      <div
        className={styles.sortOptions}
        style={{ gridTemplateColumns: `repeat(${sortOptions.length}, minmax(0, 1fr))` }}
      >
        {sortOptions.map((option) => {
          const active = sortBy === option.value;
          const next = active ? (sortOrder === "desc" ? "asc" : "desc") : option.initialOrder;
          return (
            <button
              key={option.value}
              type="button"
              className={styles.option}
              aria-pressed={active}
              aria-label={`${option.label}で${next === "asc" ? (option.ascendingLabel ?? "昇順") : "降順"}に並べ替え`}
              onClick={() => onSortChange(option.value)}
            >
              {option.label}
              {active && <span aria-hidden="true">{sortOrder === "desc" ? "↓" : "↑"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
