import { notify } from "@yahatapp/ui";
import type { CafeLogFormValues } from "./cafeLogForm";
import { getErrorMessage } from "./errors";
import { createLog, updateLog, uploadLogImages, type LogResponse } from "./queries";

export const saveLogWithImages = async ({
  id,
  values,
}: {
  id?: string;
  values: CafeLogFormValues;
}) => {
  let log: LogResponse;
  try {
    log = id ? await updateLog({ id, values }) : await createLog(values);
  } catch (error) {
    notify({
      variant: "error",
      message: getErrorMessage(error, "記録の保存に失敗しました。通信状況を確認してください。"),
    });
    throw error;
  }

  try {
    await uploadLogImages(log.id, values.images);
  } catch (error) {
    notify({
      variant: "warning",
      message: `記録は保存済みです。${getErrorMessage(error, "写真のアップロードに失敗しました。")} 未保存の写真は、編集画面からもう一度追加してください。`,
    });
    return log;
  }

  notify({ variant: "success", message: id ? "記録を更新しました。" : "記録を保存しました。" });
  return log;
};
