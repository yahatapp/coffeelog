import { useState, type ReactNode } from "react";
import { CAFELOG_PROCESS_METHODS } from "@yahatapp/coffee-reference";
import { Field, Input, Select } from "@yahatapp/ui";
import styles from "./process-field.module.css";
const PROCESS_OPTIONS = CAFELOG_PROCESS_METHODS;
const OTHER_PROCESS = "その他";
type ProcessFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  children?: ReactNode;
};
const isPresetProcess = (value: string) => PROCESS_OPTIONS.some((option) => option === value);
export const ProcessField = ({
  id,
  value,
  onChange,
  onBlur,
  error,
  children,
}: ProcessFieldProps) => {
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
    <div className={styles.root}>
      <Field id={id} label="精製方法" error={error}>
        {(control) => (
          <Select
            {...control}
            value={isOther ? OTHER_PROCESS : value}
            onChange={(event) => handleSelection(event.target.value)}
            onBlur={onBlur}
          >
            <option value="">未選択</option>
            {PROCESS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={OTHER_PROCESS}>{OTHER_PROCESS}</option>
          </Select>
        )}
      </Field>
      {children}
      {isOther && (
        <div className={styles.other}>
          <Field id={`${id}-other`} label="その他の精製方法" error={error}>
            {(control) => (
              <Input
                {...control}
                type="text"
                value={value}
                onChange={(event) => {
                  setSelectedOther(true);
                  onChange(event.target.value);
                }}
                onBlur={onBlur}
                placeholder="精製方法を入力"
              />
            )}
          </Field>
        </div>
      )}
    </div>
  );
};
