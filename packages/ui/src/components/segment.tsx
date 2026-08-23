import { useId } from "react";
import { cn } from "../lib/cn";

export type SegmentOption<T extends string> = {
  readonly label: string;
  readonly value: T;
};

export type SegmentProps<T extends string> = {
  readonly value: T | null;
  readonly onValueChange: (value: T) => void;
  readonly options: readonly SegmentOption<T>[];
  readonly ariaLabel: string;
  readonly className?: string;
};

export function Segment<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: SegmentProps<T>) {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-border bg-muted p-1", className)}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <label
            key={option.value}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-2.5 text-center text-xs font-bold transition-all has-focus-visible:ring-2 has-focus-visible:ring-ring active:scale-[0.98]",
              selected ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:bg-primary/5 hover:text-primary",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onValueChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
