import { useEffect, useState } from "react";

const PROCESS_OPTIONS = [
  "ウォッシュド",
  "ナチュラル",
  "ハニー",
  "パルプドナチュラル",
  "アナエロビック",
] as const;
const OTHER_PROCESS = "その他";

type ProcessFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

const isPresetProcess = (value: string) => PROCESS_OPTIONS.some((option) => option === value);

export const ProcessField = ({ id, value, onChange }: ProcessFieldProps) => {
  const [isOther, setIsOther] = useState(() => value !== "" && !isPresetProcess(value));

  useEffect(() => {
    if (value !== "") {
      setIsOther(!isPresetProcess(value));
    }
  }, [value]);

  const handleSelection = (selection: string) => {
    if (selection === OTHER_PROCESS) {
      setIsOther(true);
      onChange("");
      return;
    }

    setIsOther(false);
    onChange(selection);
  };

  return (
    <div className="space-y-2">
      <select
        id={id}
        value={isOther ? OTHER_PROCESS : value}
        onChange={(event) => handleSelection(event.target.value)}
        className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
      >
        <option value="">未選択</option>
        {PROCESS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={OTHER_PROCESS}>{OTHER_PROCESS}</option>
      </select>

      {isOther && (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="精製方法を入力"
          aria-label="その他の精製方法"
          className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
        />
      )}
    </div>
  );
};
