import { logCreateSchema } from "@/contracts";
import { toLogCreateInput, type LogFormValues } from "./form-values";

export function validateBrewLog({ value }: { value: LogFormValues }) {
  const fields: Record<string, string> = {};
  if (!value.beanId) fields.beanId = "コーヒー豆を選択してください。";
  if (!value.dripperId) fields.dripperId = "ドリッパーを選択してください。";

  const amounts = [
    ["waterTemp", "湯温"],
    ["beanAmount", "豆量"],
    ["waterAmount", "注水量"],
    ...(value.tempType === "ice" ? ([["iceAmount", "氷の量"]] as const) : []),
  ] as const;
  for (const [name, label] of amounts) {
    if (value[name] === "" || Number(value[name]) <= 0) {
      fields[name] = `${label}には0より大きい数値を入力してください。`;
    }
  }

  const parsed = logCreateSchema.safeParse(toLogCreateInput(value));
  if (!parsed.success) {
    for (const { path } of parsed.error.issues) {
      const name = path
        .map((part) => (typeof part === "number" ? `[${part}]` : String(part)))
        .join(".")
        .replace(/\.\[/g, "[");
      fields[name] ??= "入力内容を確認してください。";
    }
  }

  if (Object.keys(fields).length > 0) return { fields };
}
