import type { ReactNode } from "react";
import type { DeepKeys, DeepValue } from "@tanstack/react-form";
import type { BeanFormValues, LogFormValues } from "@/lib/form-values";

type FormField<TValue> = {
  state: {
    value: TValue;
    meta: {
      isDirty: boolean;
      errors: readonly unknown[];
    };
  };
  handleChange: (updater: TValue | ((previous: TValue) => TValue)) => void;
  handleBlur: () => void;
};

type FormFieldRenderer<TFormData> = <TName extends DeepKeys<TFormData>>(props: {
  name: TName;
  mode?: "value" | "array";
  children: (field: FormField<DeepValue<TFormData, TName>>) => ReactNode;
}) => ReactNode | Promise<ReactNode>;

type FormSubscribeRenderer<TFormData> = <TSelected>(props: {
  selector?: (state: { values: TFormData }) => TSelected;
  children: ((selected: TSelected) => ReactNode) | ReactNode;
}) => ReactNode | Promise<ReactNode>;

export type FormApiLike<TFormData> = {
  formId?: string;
  Field: FormFieldRenderer<TFormData>;
  Subscribe: FormSubscribeRenderer<TFormData>;
  setFieldValue: <TName extends DeepKeys<TFormData>>(
    field: TName,
    updater:
      | DeepValue<TFormData, TName>
      | ((previous: DeepValue<TFormData, TName>) => DeepValue<TFormData, TName>),
  ) => void;
  getFieldValue: <TName extends DeepKeys<TFormData>>(field: TName) => DeepValue<TFormData, TName>;
  reset: (values?: TFormData) => void;
  handleSubmit: () => Promise<void>;
};

export type BeanFormApi = FormApiLike<BeanFormValues>;
export type LogFormApi = FormApiLike<LogFormValues>;
