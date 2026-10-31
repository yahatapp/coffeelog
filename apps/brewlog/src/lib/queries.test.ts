import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { noticeStore } from "@yahatapp/ui";
import { beanQueries, mutations } from "./queries";

const fetchMock = vi.fn<typeof fetch>();
const param = { id: "test-id" };
const cases: [string, () => Promise<unknown>][] = [
  [
    "豆を登録しました。",
    () => mutations.createBean({ json: { name: "豆", coffeeType: "regular" } }),
  ],
  ["豆を更新しました。", () => mutations.updateBean({ param, json: { name: "豆" } })],
  ["豆をアーカイブしました。", () => mutations.updateBean({ param, json: { isArchived: true } })],
  [
    "豆をアーカイブから戻しました。",
    () => mutations.updateBean({ param, json: { isArchived: false } }),
  ],
  ["豆を削除しました。", () => mutations.deleteBean(param.id)],
  ["抽出記録を保存しました。", () => mutations.createLog({ json: { beanId: param.id } })],
  ["抽出記録を更新しました。", () => mutations.updateLog({ param, json: { note: "メモ" } })],
  ["ドリッパーを登録しました。", () => mutations.createDripper({ json: { name: "V60" } })],
  ["ドリッパーを更新しました。", () => mutations.updateDripper({ param, json: { name: "V60" } })],
  [
    "デフォルトのドリッパーを設定しました。",
    () => mutations.updateDripper({ param, json: { isDefault: true } }),
  ],
  ["ドリッパーを削除しました。", () => mutations.deleteDripper(param.id)],
  [
    "グラインダーを登録しました。",
    () =>
      mutations.createGrinder({
        json: { name: "C40", fineMax: 6, mediumFineMax: 9, mediumMax: 15, mediumCoarseMax: 22 },
      }),
  ],
  ["グラインダーを更新しました。", () => mutations.updateGrinder({ param, json: { name: "C40" } })],
  [
    "デフォルトのグラインダーを設定しました。",
    () => mutations.updateGrinder({ param, json: { isDefault: true } }),
  ],
  ["グラインダーを削除しました。", () => mutations.deleteGrinder(param.id)],
];

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  for (const notice of noticeStore.getSnapshot()) noticeStore.dismiss(notice.id);
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("更新APIのフローティング通知", () => {
  it.each(cases)("成功: %s", async (message, mutate) => {
    fetchMock.mockResolvedValue(Response.json({ id: param.id }));
    await expect(mutate()).resolves.toEqual({ id: param.id });
    expect(noticeStore.getSnapshot()).toEqual([
      expect.objectContaining({ variant: "success", message }),
    ]);
  });

  it.each(cases)("HTTPエラー: %s", async (_message, mutate) => {
    fetchMock.mockResolvedValue(new Response("Server error", { status: 500 }));
    await expect(mutate()).rejects.toThrow();
    expect(noticeStore.getSnapshot()).toEqual([expect.objectContaining({ variant: "error" })]);
    expect(noticeStore.getSnapshot()[0].message).toContain("失敗しました");
  });

  it("通信切断でもエラー通知を出し、呼び出し元に失敗を返す", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    await expect(mutations.deleteBean(param.id)).rejects.toBe(error);
    expect(noticeStore.getSnapshot()).toEqual([expect.objectContaining({ variant: "error" })]);
  });

  it("一覧取得は通知しない", async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    await new QueryClient().fetchQuery(beanQueries.all());
    expect(noticeStore.getSnapshot()).toEqual([]);
  });

  it("同じエラーを繰り返しても、閉じた通知とは別の通知を出す", async () => {
    fetchMock.mockResolvedValue(new Response("Server error", { status: 500 }));
    await expect(mutations.deleteBean(param.id)).rejects.toThrow();
    const first = noticeStore.getSnapshot()[0];
    noticeStore.dismiss(first.id);
    await expect(mutations.deleteBean(param.id)).rejects.toThrow();
    expect(noticeStore.getSnapshot()[0].id).not.toBe(first.id);
    expect(noticeStore.getSnapshot()[0].message).toBe(first.message);
  });
});
