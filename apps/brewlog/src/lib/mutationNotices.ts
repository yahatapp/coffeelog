import type { MutationNoticeMeta } from "@yahatapp/ui";

export const mutationNotices = {
  createBean: { notice: { success: "豆を登録しました。", error: "豆の登録に失敗しました。" } },
  updateBean: { notice: { success: "豆を更新しました。", error: "豆の更新に失敗しました。" } },
  setBeanArchived: { notice: { error: "豆のアーカイブ状態の変更に失敗しました。" } },
  deleteBean: { notice: { success: "豆を削除しました。", error: "豆の削除に失敗しました。" } },
  createLog: {
    notice: { success: "抽出記録を保存しました。", error: "抽出記録の保存に失敗しました。" },
  },
  updateLog: {
    notice: { success: "抽出記録を更新しました。", error: "抽出記録の更新に失敗しました。" },
  },
  createDripper: {
    notice: { success: "ドリッパーを登録しました。", error: "ドリッパーの登録に失敗しました。" },
  },
  updateDripper: {
    notice: { success: "ドリッパーを更新しました。", error: "ドリッパーの更新に失敗しました。" },
  },
  defaultDripper: {
    notice: {
      success: "デフォルトのドリッパーを設定しました。",
      error: "ドリッパーの更新に失敗しました。",
    },
  },
  deleteDripper: {
    notice: { success: "ドリッパーを削除しました。", error: "ドリッパーの削除に失敗しました。" },
  },
  createGrinder: {
    notice: {
      success: "グラインダーを登録しました。",
      error: "グラインダーの登録に失敗しました。",
    },
  },
  updateGrinder: {
    notice: {
      success: "グラインダーを更新しました。",
      error: "グラインダーの更新に失敗しました。",
    },
  },
  defaultGrinder: {
    notice: {
      success: "デフォルトのグラインダーを設定しました。",
      error: "グラインダーの更新に失敗しました。",
    },
  },
  deleteGrinder: {
    notice: {
      success: "グラインダーを削除しました。",
      error: "グラインダーの削除に失敗しました。",
    },
  },
} satisfies Record<string, MutationNoticeMeta>;
