import type { MutationNoticeMeta } from "@yahatapp/ui";
import { getErrorMessage } from "./errors";

export const mutationNotices = {
  createLog: {
    notice: {
      success: "記録を保存しました。",
      error: (error: Error) => getErrorMessage(error, "記録の保存に失敗しました。"),
    },
  },
  updateLog: {
    notice: {
      success: "記録を更新しました。",
      error: (error: Error) => getErrorMessage(error, "記録の更新に失敗しました。"),
    },
  },
  deleteLog: {
    notice: {
      success: "記録を削除しました。",
      error: (error: Error) => getErrorMessage(error, "記録の削除に失敗しました。"),
    },
  },
} satisfies Record<string, MutationNoticeMeta>;
