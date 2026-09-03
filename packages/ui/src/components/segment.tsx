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
  readonly disabled?: boolean;
};

export function Segment<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
  disabled = false,
}: SegmentProps<T>) {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={cn("grid grid-flow-col auto-cols-fr gap-1 rounded-2xl bg-muted/10 p-1", className)}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <label
            key={option.value}
            className={cn(
              "rounded-xl px-3 py-2.5 text-center text-xs font-bold transition-all has-focus-visible:ring-2 has-focus-visible:ring-ring",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer active:scale-[0.98]",
              selected
                ? "bg-surface text-primary shadow-sm"
                : cn("text-muted", !disabled && "hover:bg-surface/60 hover:text-primary"),
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              disabled={disabled}
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
