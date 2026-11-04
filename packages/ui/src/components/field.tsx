import { useId, type ReactNode } from "react";
import { Label } from "./label";
import styles from "./field.module.css";
export type FieldControl = {
  id: string;
  required: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};
export type FieldProps = {
  id?: string;
  label: ReactNode;
  labelVariant?: "default" | "secondary";
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (control: FieldControl) => ReactNode;
};
export function Field({
  id: provided,
  label,
  labelVariant = "default",
  description,
  error,
  required = false,
  children,
}: FieldProps) {
  const generated = useId();
  const id = provided ?? generated;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.root}>
      <Label
        htmlFor={id}
        className={labelVariant === "secondary" ? styles.secondaryLabel : undefined}
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      {children({
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
