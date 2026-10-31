import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { noticeStore } from "@yahatapp/ui";
import { deleteLog, uploadLogImages } from "./queries";
import { resizeToJpeg } from "./images";
import { createCafeLogDefaults } from "./cafeLogForm";
import { saveLogWithImages } from "./saveLog";

vi.mock("./images", () => ({ resizeToJpeg: vi.fn() }));
const fetchMock = vi.fn<typeof fetch>();
const photo = () => ({
  file: new File(["original"], "photo.jpg", { type: "image/jpeg" }),
  previewUrl: "blob:preview",
});
const sentId = (init?: RequestInit) => {
  if (!(init?.body instanceof FormData)) throw new Error("Expected multipart upload");
  return init.body.get("imageId");
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(resizeToJpeg).mockResolvedValue(
    new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }),
  );
});
afterEach(() => {
  for (const notice of noticeStore.getSnapshot()) noticeStore.dismiss(notice.id);
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
      const values = { ...createCafeLogDefaults(), images: [photo()] };
      const pending = saveLogWithImages({ id, values });
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][1]?.method).toBe(id ? "PATCH" : "POST");
      expect(noticeStore.getSnapshot()).toEqual([]);
      upload.resolve(new Response(null, { status: 201 }));
      await expect(pending).resolves.toEqual({ id: "log" });
      expect(noticeStore.getSnapshot()).toEqual([
        expect.objectContaining({
          variant: "success",
          message: id ? "記録を更新しました。" : "記録を保存しました。",
        }),
      ]);
    },
  );

  it("写真なしの保存でも成功を通知する", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: "log" }));
    await saveLogWithImages({ values: createCafeLogDefaults() });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(noticeStore.getSnapshot()).toEqual([expect.objectContaining({ variant: "success" })]);
  });

  it.each([undefined, "log"])(
    "写真だけ失敗したら保存済みの記録を返し、警告だけを通知する（id: %s）",
    async (id) => {
      fetchMock
        .mockResolvedValueOnce(Response.json({ id: "log" }))
        .mockResolvedValueOnce(new Response("Invalid image", { status: 400 }));
      await expect(
        saveLogWithImages({ id, values: { ...createCafeLogDefaults(), images: [photo()] } }),
      ).resolves.toEqual({ id: "log" });
      expect(noticeStore.getSnapshot()).toEqual([expect.objectContaining({ variant: "warning" })]);
      expect(noticeStore.getSnapshot()[0].message).toContain("記録は保存済みです。");
      expect(noticeStore.getSnapshot()[0].message).toContain(
        "編集画面からもう一度追加してください。",
      );
    },
  );

  it.each([undefined, "log"])(
    "記録が保存できない場合は写真を送らず、エラーだけを通知する（id: %s）",
    async (id) => {
      fetchMock.mockResolvedValue(new Response("保存できませんでした。", { status: 500 }));
      await expect(
        saveLogWithImages({ id, values: { ...createCafeLogDefaults(), images: [photo()] } }),
      ).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(noticeStore.getSnapshot()).toEqual([expect.objectContaining({ variant: "error" })]);
    },
  );

  it("削除成功を通知する", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: "log" }));
    await deleteLog("log");
    expect(noticeStore.getSnapshot()).toEqual([
      expect.objectContaining({ variant: "success", message: "記録を削除しました。" }),
    ]);
  });

  it("削除の通信エラーを通知し、呼び出し元にも返す", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    await expect(deleteLog("log")).rejects.toBe(error);
    expect(noticeStore.getSnapshot()).toEqual([expect.objectContaining({ variant: "error" })]);
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
