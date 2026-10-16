import { useState, type ReactNode } from "react";
import { CAFELOG_PROCESS_METHODS } from "@yahatapp/coffee-reference";

const PROCESS_OPTIONS = CAFELOG_PROCESS_METHODS;
const OTHER_PROCESS = "その他";

type ProcessFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  children?: ReactNode;
};

const isPresetProcess = (value: string) => PROCESS_OPTIONS.some((option) => option === value);

export const ProcessField = ({ id, value, onChange, children }: ProcessFieldProps) => {
  const [selectedOther, setSelectedOther] = useState(() => value !== "" && !isPresetProcess(value));
  const isOther = value !== "" ? !isPresetProcess(value) : selectedOther;

  const handleSelection = (selection: string) => {
    if (selection === OTHER_PROCESS) {
      setSelectedOther(true);
      onChange("");
      return;
    }

    setSelectedOther(false);
    onChange(selection);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor={id} className="text-xs font-bold text-cafe-text block mb-1.5">
          精製方法
        </label>
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
      </div>
      {children}

      {isOther && (
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setSelectedOther(true);
            onChange(event.target.value);
          }}
          placeholder="精製方法を入力"
          aria-label="その他の精製方法"
          className="col-span-2 w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
        />
      )}
    </div>
  );
};
