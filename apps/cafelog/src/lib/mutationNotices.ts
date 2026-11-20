import type { MutationNoticeMeta } from "@yahatapp/ui";
import { ApiError } from "./api";

export const mutationNotices = {
  deleteLog: { notice: { success: "記録を削除しました。" } },
} satisfies Record<string, MutationNoticeMeta>;

export function cafeMutationError(error: unknown, action: "保存" | "更新" | "削除") {
  const summary = `記録の${action}に失敗しました。`;
  const retained = action === "削除" ? "" : "入力内容は保持されています。";
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return `${summary}${retained}LINEでログインし直してからお試しください。`;
    }
    if (error.status === 404) {
      return `${summary}記録一覧から対象の記録を開き直してください。`;
    }
    if (error.status === 400 || error.status === 422) {
      return `${summary}${retained}入力内容を確認してください。`;
    }
  }
  return `${summary}${retained}通信状況を確認し、もう一度${action}してください。`;
}
