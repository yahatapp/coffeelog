import { useId } from "react";

type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentProps<T extends string> = {
  value: T | null;
  onValueChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  ariaLabel: string;
};

export const Segment = <T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
}: SegmentProps<T>) => {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-cafe-secondary/20 bg-cafe-background p-1"
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <label
            key={option.value}
            className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-xs font-bold transition-all has-focus-visible:ring-2 has-focus-visible:ring-cafe-primary/20 active:scale-[0.98] ${
              selected
                ? "bg-cafe-primary text-white shadow-sm"
                : "text-cafe-secondary hover:bg-cafe-primary/5 hover:text-cafe-primary"
            }`}
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
};
