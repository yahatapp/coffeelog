import styles from "./segment.module.css";
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
      className={cn(styles.root, className)}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <label
            key={option.value}
            className={styles.option}
            data-selected={selected || undefined}
            data-disabled={disabled || undefined}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onValueChange(option.value)}
              className={styles.radio}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
