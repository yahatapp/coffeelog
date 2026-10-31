import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { createMutationNoticeCache, noticeManager } from "@yahatapp/ui";
import { deleteLog, uploadLogImages } from "./queries";
import { resizeToJpeg } from "./images";
import { createCafeLogDefaults, type CafeLogFormValues } from "./cafeLogForm";
import { saveLogWithImages } from "./saveLog";
import { mutationNotices } from "./mutationNotices";

vi.mock("./images", () => ({ resizeToJpeg: vi.fn() }));
const fetchMock = vi.fn<typeof fetch>();
const addNotice = vi.spyOn(noticeManager, "add");
let client: QueryClient;
const photo = () => ({
  file: new File(["original"], "photo.jpg", { type: "image/jpeg" }),
  previewUrl: "blob:preview",
});
const sentId = (init?: RequestInit) => {
  if (!(init?.body instanceof FormData)) throw new Error("Expected multipart upload");
  return init.body.get("imageId");
};
const save = ({ id, values }: { id?: string; values: CafeLogFormValues }) =>
  new MutationObserver(client, {
    mutationFn: saveLogWithImages,
    meta: id ? mutationNotices.updateLog : mutationNotices.createLog,
  }).mutate({ id, values });
const remove = () =>
  new MutationObserver(client, { mutationFn: deleteLog, meta: mutationNotices.deleteLog }).mutate(
    "log",
  );

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  addNotice.mockReturnValue("notice-id");
  client = new QueryClient({
    mutationCache: createMutationNoticeCache(),
    defaultOptions: { mutations: { gcTime: Infinity } },
  });
  vi.mocked(resizeToJpeg).mockResolvedValue(
    new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }),
  );
});
afterEach(() => {
  client.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("記録と写真の保存結果の通知", () => {
  it.each([undefined, "log"])(
    "写真も保存し終えてから一度だけ成功を通知する（id: %s）",
    async (id) => {
      const upload = Promise.withResolvers<Response>();
      fetchMock
        .mockResolvedValueOnce(Response.json({ id: "log" }))
        .mockReturnValueOnce(upload.promise);
      const pending = save({ id, values: { ...createCafeLogDefaults(), images: [photo()] } });
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][1]?.method).toBe(id ? "PATCH" : "POST");
      expect(addNotice).not.toHaveBeenCalled();
      upload.resolve(new Response(null, { status: 201 }));
      await expect(pending).resolves.toEqual({ data: { id: "log" } });
      expect(addNotice).toHaveBeenCalledExactlyOnceWith({
        title: id ? "記録を更新しました。" : "記録を保存しました。",
        type: "success",
        timeout: 5000,
        priority: "low",
      });
    },
  );

  it("写真なしの保存でも成功を通知する", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: "log" }));
    await save({ values: createCafeLogDefaults() });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(addNotice).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, "log"])(
    "写真だけ失敗したら保存済みの記録を返し、警告だけを通知する（id: %s）",
    async (id) => {
      fetchMock
        .mockResolvedValueOnce(Response.json({ id: "log" }))
        .mockResolvedValueOnce(new Response("Invalid image", { status: 400 }));
      await expect(
        save({ id, values: { ...createCafeLogDefaults(), images: [photo()] } }),
      ).resolves.toMatchObject({ data: { id: "log" }, notice: { variant: "warning" } });
      expect(addNotice).toHaveBeenCalledTimes(1);
      expect(addNotice).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning", timeout: 0, priority: "high" }),
      );
      const message = addNotice.mock.calls[0][0].title;
      expect(message).toContain("記録は保存済みです。");
      expect(message).toContain("編集画面からもう一度追加してください。");
    },
  );

  it.each([undefined, "log"])(
    "記録が保存できない場合は写真を送らず、エラーだけを通知する（id: %s）",
    async (id) => {
      fetchMock.mockResolvedValue(new Response("保存できませんでした。", { status: 500 }));
      await expect(
        save({ id, values: { ...createCafeLogDefaults(), images: [photo()] } }),
      ).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(addNotice).toHaveBeenCalledExactlyOnceWith({
        title: "保存できませんでした。",
        type: "error",
        timeout: 0,
        priority: "high",
      });
    },
  );

  it("削除成功を通知する", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: "log" }));
    await remove();
    expect(addNotice).toHaveBeenCalledExactlyOnceWith({
      title: "記録を削除しました。",
      type: "success",
      timeout: 5000,
      priority: "low",
    });
  });

  it("削除の通信エラーを一度だけ通知し、呼び出し元にも返す", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    await expect(remove()).rejects.toBe(error);
    expect(addNotice).toHaveBeenCalledTimes(1);
    expect(addNotice).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });
});

describe("写真アップロードの再送", () => {
  it("通信切断後に同じ画像IDで再送し、圧縮は一度だけ行う", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Load failed"))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    const pending = uploadLogImages("log", [photo()]);
    await vi.runAllTimersAsync();
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const ids = fetchMock.mock.calls.map(([, init]) => sentId(init));
    expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(ids[1]).toBe(ids[0]);
    expect(resizeToJpeg).toHaveBeenCalledTimes(1);
  });

  it.each([503, 409])("一時的なHTTP %iから回復する", async (status) => {
    fetchMock
      .mockResolvedValueOnce(new Response("Temporary failure", { status }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    const pending = uploadLogImages("log", [photo()]);
    await vi.runAllTimersAsync();
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("認証エラーは再送せず、再ログインの案内を返す", async () => {
    fetchMock.mockResolvedValue(new Response("Unauthorized", { status: 401 }));
    await expect(uploadLogImages("log", [photo()])).rejects.toThrow("ログインの有効期限");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("3回失敗したら通信状況の案内を返す", async () => {
    fetchMock.mockRejectedValue(new DOMException("Timeout", "TimeoutError"));
    const rejected = expect(uploadLogImages("log", [photo()])).rejects.toThrow("通信状況を確認");
    await vi.runAllTimersAsync();
    await rejected;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("途中で失敗して保存し直しても、保存済みの写真に同じIDを使う", async () => {
    const images = [photo(), photo()];
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(new Response("Bad image", { status: 400 }));
    await expect(uploadLogImages("log", images)).rejects.toThrow("写真の枚数や形式");
    const originalIds = fetchMock.mock.calls.map(([, init]) => sentId(init));
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await uploadLogImages("log", images);
    expect(fetchMock.mock.calls.slice(2).map(([, init]) => sentId(init))).toEqual(originalIds);
    expect(originalIds[0]).not.toBe(originalIds[1]);
  });

  it("変換できない写真は送信せず、形式の案内を返す", async () => {
    vi.mocked(resizeToJpeg).mockRejectedValue(
      new DOMException("Cannot decode", "InvalidStateError"),
    );
    await expect(uploadLogImages("log", [photo()])).rejects.toThrow("JPEGやPNG");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("同じファイルを別の記録に保存するときは別のIDを使う", async () => {
    const image = photo();
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
    await uploadLogImages("first-log", [image]);
    await uploadLogImages("second-log", [image]);
    const ids = fetchMock.mock.calls.map(([, init]) => sentId(init));
    expect(ids[0]).not.toBe(ids[1]);
  });
});
