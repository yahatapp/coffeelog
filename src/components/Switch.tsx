type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  checkedLabel: string;
  uncheckedLabel: string;
  ariaLabel: string;
};

export const Switch = ({
  checked,
  onCheckedChange,
  checkedLabel,
  uncheckedLabel,
  ariaLabel,
}: SwitchProps) => (
  <div className="flex items-center justify-between rounded-xl border border-cafe-secondary/20 bg-cafe-background px-4 py-3">
    <span className="text-sm font-bold text-cafe-text">
      {checked ? checkedLabel : uncheckedLabel}
    </span>
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cafe-primary/20 focus:ring-offset-2 ${
        checked ? "bg-cafe-primary" : "bg-cafe-secondary/30"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);
