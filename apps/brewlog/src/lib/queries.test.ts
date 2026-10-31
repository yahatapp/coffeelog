import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { createMutationNoticeCache, noticeManager, type MutationNoticeMeta } from "@yahatapp/ui";
import { beanQueries, mutations } from "./queries";
import { mutationNotices } from "./mutationNotices";

const fetchMock = vi.fn<typeof fetch>();
const addNotice = vi.spyOn(noticeManager, "add");
const param = { id: "test-id" };
let client: QueryClient;
const archiveBean = async (isArchived: boolean) => ({
  data: await mutations.setBeanArchived({ id: param.id, isArchived }),
  notice: {
    variant: "success",
    message: isArchived ? "豆をアーカイブしました。" : "豆をアーカイブから戻しました。",
  },
});
const execute = (mutationFn: () => Promise<unknown>, meta?: MutationNoticeMeta) =>
  new MutationObserver(client, { mutationFn, meta }).mutate(undefined);

const cases: [keyof typeof mutationNotices, string, () => Promise<unknown>][] = [
  [
    "createBean",
    "豆を登録しました。",
    () => mutations.createBean({ json: { name: "豆", coffeeType: "regular" } }),
  ],
  ["updateBean", "豆を更新しました。", () => mutations.updateBean({ param, json: { name: "豆" } })],
  ["setBeanArchived", "豆をアーカイブしました。", () => archiveBean(true)],
  ["setBeanArchived", "豆をアーカイブから戻しました。", () => archiveBean(false)],
  ["deleteBean", "豆を削除しました。", () => mutations.deleteBean(param.id)],
  [
    "createLog",
    "抽出記録を保存しました。",
    () => mutations.createLog({ json: { beanId: param.id } }),
  ],
  [
    "updateLog",
    "抽出記録を更新しました。",
    () => mutations.updateLog({ param, json: { note: "メモ" } }),
  ],
  [
    "createDripper",
    "ドリッパーを登録しました。",
    () => mutations.createDripper({ json: { name: "V60" } }),
  ],
  [
    "updateDripper",
    "ドリッパーを更新しました。",
    () => mutations.updateDripper({ param, json: { name: "V60" } }),
  ],
  [
    "defaultDripper",
    "デフォルトのドリッパーを設定しました。",
    () => mutations.updateDripper({ param, json: { isDefault: true } }),
  ],
  ["deleteDripper", "ドリッパーを削除しました。", () => mutations.deleteDripper(param.id)],
  [
    "createGrinder",
    "グラインダーを登録しました。",
    () =>
      mutations.createGrinder({
        json: { name: "C40", fineMax: 6, mediumFineMax: 9, mediumMax: 15, mediumCoarseMax: 22 },
      }),
  ],
  [
    "updateGrinder",
    "グラインダーを更新しました。",
    () => mutations.updateGrinder({ param, json: { name: "C40" } }),
  ],
  [
    "defaultGrinder",
    "デフォルトのグラインダーを設定しました。",
    () => mutations.updateGrinder({ param, json: { isDefault: true } }),
  ],
  ["deleteGrinder", "グラインダーを削除しました。", () => mutations.deleteGrinder(param.id)],
];

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  addNotice.mockReturnValue("notice-id");
  client = new QueryClient({
    mutationCache: createMutationNoticeCache(),
    defaultOptions: { mutations: { gcTime: Infinity } },
  });
});
afterEach(() => {
  client.clear();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("MutationCacheによる更新結果の通知", () => {
  it.each([false, true])("通常の編集はisArchived=%sでも更新成功を通知する", async (isArchived) => {
    const payload = { name: "変更後の豆", note: "変更後のメモ", isArchived };
    fetchMock.mockResolvedValue(Response.json({ id: param.id, ...payload }));
    await execute(() => mutations.updateBean({ param, json: payload }), mutationNotices.updateBean);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(payload));
    expect(addNotice).toHaveBeenCalledExactlyOnceWith({
      title: "豆を更新しました。",
      type: "success",
      timeout: 5000,
      priority: "low",
    });
  });

  it.each(cases)("成功: %s %s", async (key, message, mutationFn) => {
    fetchMock.mockResolvedValue(Response.json({ id: param.id }));
    await execute(mutationFn, mutationNotices[key]);
    expect(addNotice).toHaveBeenCalledExactlyOnceWith({
      title: message,
      type: "success",
      timeout: 5000,
      priority: "low",
    });
  });

  it.each(cases)("HTTPエラー: %s %s", async (key, _message, mutationFn) => {
    fetchMock.mockResolvedValue(new Response("Server error", { status: 500 }));
    await expect(execute(mutationFn, mutationNotices[key])).rejects.toThrow();
    expect(addNotice).toHaveBeenCalledTimes(1);
    expect(addNotice).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", timeout: 0, priority: "high" }),
    );
  });

  it("API関数を直接呼んだ場合や通知指定のないmutationでは通知しない", async () => {
    fetchMock.mockImplementation(async () => Response.json({ id: param.id }));
    await mutations.deleteBean(param.id);
    await execute(() => mutations.deleteBean(param.id));
    expect(addNotice).not.toHaveBeenCalled();
  });

  it("一覧取得は通知しない", async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    await client.fetchQuery(beanQueries.all());
    expect(addNotice).not.toHaveBeenCalled();
  });

  it("ネットワーク障害後の再試行が成功したら、成功だけを一度通知する", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(Response.json({ id: param.id }));
    const observer = new MutationObserver(client, {
      mutationFn: mutations.deleteBean,
      meta: mutationNotices.deleteBean,
      retry: 1,
      retryDelay: 0,
    });
    await observer.mutate(param.id);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(addNotice).toHaveBeenCalledExactlyOnceWith({
      title: "豆を削除しました。",
      type: "success",
      timeout: 5000,
      priority: "low",
    });
  });

  it("再試行を使い切ったらエラーを一度だけ通知する", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    const observer = new MutationObserver(client, {
      mutationFn: mutations.deleteBean,
      meta: mutationNotices.deleteBean,
      retry: 1,
      retryDelay: 0,
    });
    await expect(observer.mutate(param.id)).rejects.toBe(error);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(addNotice).toHaveBeenCalledExactlyOnceWith({
      title: "豆の削除に失敗しました。",
      type: "error",
      timeout: 0,
      priority: "high",
    });
  });

  it("画面の購読が終わった後も通知する", async () => {
    const response = Promise.withResolvers<Response>();
    fetchMock.mockReturnValue(response.promise);
    const observer = new MutationObserver(client, {
      mutationFn: mutations.deleteBean,
      meta: mutationNotices.deleteBean,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    const pending = observer.mutate(param.id);
    unsubscribe();
    response.resolve(Response.json({ id: param.id }));
    await pending;
    expect(addNotice).toHaveBeenCalledTimes(1);
  });

  it("同じエラーを繰り返しても、そのたびに通知する", async () => {
    fetchMock.mockResolvedValue(new Response("Server error", { status: 500 }));
    for (let i = 0; i < 2; i++)
      await expect(
        execute(() => mutations.deleteBean(param.id), mutationNotices.deleteBean),
      ).rejects.toThrow();
    expect(addNotice).toHaveBeenCalledTimes(2);
  });
});
