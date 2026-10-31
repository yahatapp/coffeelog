import type { MutationNoticeResult } from "@yahatapp/ui";
import type { CafeLogFormValues } from "./cafeLogForm";
import { getErrorMessage } from "./errors";
import { createLog, updateLog, uploadLogImages, type LogResponse } from "./queries";

export const saveLogWithImages = async ({
  id,
  values,
}: {
  id?: string;
  values: CafeLogFormValues;
}): Promise<MutationNoticeResult<LogResponse>> => {
  const log = id ? await updateLog({ id, values }) : await createLog(values);
  try {
    await uploadLogImages(log.id, values.images);
  } catch (error) {
    return {
      data: log,
      notice: {
        variant: "warning",
        message: `記録は保存済みです。${getErrorMessage(error, "写真のアップロードに失敗しました。")} 未保存の写真は、編集画面からもう一度追加してください。`,
      },
    };
  }
  return { data: log };
};
