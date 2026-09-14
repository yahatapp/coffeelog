import type { ReactNode } from "react";
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

const filterOptions: ReadonlyArray<{
  value: LogTemperatureFilter;
  label: string;
  marker?: ReactNode;
  activeClassName: string;
}> = [
  { value: "all", label: "すべて", activeClassName: "bg-surface text-primary shadow-sm" },
  {
    value: "hot",
    label: "ホット",
    marker: <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />,
    activeClassName: "border border-orange-100 bg-orange-50 text-orange-700 shadow-sm",
  },
  {
    value: "iced",
    label: "アイス",
    marker: <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />,
    activeClassName: "border border-blue-100 bg-blue-50 text-blue-700 shadow-sm",
  },
];

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
  <div className={cn("space-y-3", className)}>
    <div className="flex space-x-1 rounded-xl bg-secondary/10 p-1" aria-label="温度で絞り込む">
      {filterOptions.map((option) => {
        const active = filter === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all",
              active
                ? option.activeClassName
                : "text-muted hover:bg-surface/60 hover:text-foreground",
            )}
          >
            {option.marker}
            <span>{option.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                active ? "bg-primary/10" : "bg-secondary/10",
              )}
            >
              {counts[option.value]}
            </span>
          </button>
        );
      })}
    </div>

    <div className="rounded-xl border border-border bg-primary/5 p-2 text-xs text-muted">
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-semibold text-primary">ソート:</span>
        <div
          className="grid min-w-0 flex-1 gap-1 rounded-lg bg-secondary/10 p-1"
          style={{ gridTemplateColumns: `repeat(${sortOptions.length}, minmax(0, 1fr))` }}
        >
          {sortOptions.map((option) => {
            const active = sortBy === option.value;
            const nextOrder = active
              ? sortOrder === "desc"
                ? "asc"
                : "desc"
              : option.initialOrder;
            const nextOrderLabel = nextOrder === "asc" ? (option.ascendingLabel ?? "昇順") : "降順";
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSortChange(option.value)}
                aria-label={`${option.label}で${nextOrderLabel}に並べ替え`}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-md px-2 transition-all",
                  active
                    ? "bg-surface font-bold text-primary shadow-sm"
                    : "text-muted hover:bg-surface/60 hover:text-foreground",
                )}
              >
                <span>{option.label}</span>
                {active && (
                  <span className="ml-1" aria-hidden="true">
                    {sortOrder === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
