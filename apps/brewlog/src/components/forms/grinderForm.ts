import { z } from "zod";

const thresholdSchema = z.union([
  z
    .number()
    .int("整数で入力してください。")
    .min(1, "1以上で入力してください。")
    .max(40, "40以下で入力してください。"),
  z.literal(""),
]);

export const grinderFormSchema = z
  .object({
    name: z.string().refine((name) => name.trim().length > 0, {
      message: "グラインダー名を入力してください。",
    }),
    fineMax: thresholdSchema,
    mediumFineMax: thresholdSchema,
    mediumMax: thresholdSchema,
    mediumCoarseMax: thresholdSchema,
    isDefault: z.boolean(),
  })
  .superRefine((value, context) => {
    const thresholds = [value.fineMax, value.mediumFineMax, value.mediumMax, value.mediumCoarseMax];

    if (thresholds.some((threshold) => threshold === "")) {
      context.addIssue({
        code: "custom",
        message: "すべての境界値を入力してください。",
      });
      return;
    }

    const [fineMax, mediumFineMax, mediumMax, mediumCoarseMax] = thresholds as [
      number,
      number,
      number,
      number,
    ];
    if (fineMax >= mediumFineMax || mediumFineMax >= mediumMax || mediumMax >= mediumCoarseMax) {
      context.addIssue({
        code: "custom",
        message: "境界値は細挽きから粗挽きへ昇順にしてください。",
      });
    }
  });

export type GrinderFormValues = z.infer<typeof grinderFormSchema>;
