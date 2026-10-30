import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadLogImages } from "./queries";
import { resizeToJpeg } from "./images";

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
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
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
