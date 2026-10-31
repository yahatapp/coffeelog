import { queryOptions } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono/client";
import { api, ApiError, assertOk, authorizedFetch } from "@/lib/api";
import { resizeToJpeg } from "@/lib/images";
import { toCafeLogPayload, type CafeLogFormValues } from "@/lib/cafeLogForm";

export type LogsResponse = InferResponseType<typeof api.api.logs.$get>;
export type LogResponse = InferResponseType<(typeof api.api.logs)[":id"]["$get"]>;
export type CreateLogInput = InferRequestType<typeof api.api.logs.$post>["json"];
export type UpdateLogInput = InferRequestType<(typeof api.api.logs)[":id"]["$patch"]>["json"];
type StoresResponse = InferResponseType<typeof api.api.stores.$get, 200>;
type StoreHistoryResponse = InferResponseType<(typeof api.api.stores)[":id"]["$get"], 200>;

export type ImageMeta = { id: string; position: number };
export type LoadedImageBlob = ImageMeta & { blob: Blob };

const parseJson = async <T>(response: {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}): Promise<T> => {
  await assertOk(response);
  return (await response.json()) as T;
};

export const fetchLogs = async (): Promise<LogsResponse> => {
  const response = await api.api.logs.$get();
  return parseJson<LogsResponse>(response);
};

export const fetchLog = async (id: string): Promise<LogResponse> => {
  const response = await api.api.logs[":id"].$get({ param: { id } });
  return parseJson<LogResponse>(response);
};

export const fetchLogImages = async (logId: string): Promise<LoadedImageBlob[]> => {
  const metadataResponse = await authorizedFetch(`/api/logs/${logId}/images`);
  const metadata = await parseJson<ImageMeta[]>(metadataResponse);

  return (
    await Promise.all(
      metadata.map(async (image) => {
        const response = await authorizedFetch(`/api/logs/${logId}/images/${image.id}`);
        if (!response.ok) return null;
        return { ...image, blob: await response.blob() };
      }),
    )
  ).filter((image): image is LoadedImageBlob => image !== null);
};

export const createLog = async (values: CafeLogFormValues) => {
  const response = await api.api.logs.$post({
    json: toCafeLogPayload(values) as CreateLogInput,
  });
  return parseJson<LogResponse>(response);
};

export const updateLog = async ({ id, values }: { id: string; values: CafeLogFormValues }) => {
  const response = await api.api.logs[":id"].$patch({
    param: { id },
    json: toCafeLogPayload(values) as UpdateLogInput,
  });
  return parseJson<LogResponse>(response);
};

export const deleteLog = async (id: string) => {
  const response = await api.api.logs[":id"].$delete({ param: { id } });
  return parseJson<LogResponse>(response);
};

// Retain the identity across automatic retries and another save of the same selection.
const uploadIds = new WeakMap<File, Map<string, string>>();
const isRetryableUploadError = (error: unknown) =>
  error instanceof ApiError
    ? [408, 409, 429, 500, 502, 503, 504].includes(error.status)
    : error instanceof TypeError ||
      (error instanceof DOMException && error.name === "TimeoutError");

const uploadImage = async (logId: string, body: FormData) => {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await authorizedFetch(`/api/logs/${logId}/images`, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(60_000),
      });
      await assertOk(response);
      return;
    } catch (error) {
      if (attempt >= 2 || !isRetryableUploadError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
};

export const uploadLogImages = async (logId: string, images: CafeLogFormValues["images"]) => {
  for (const selected of images) {
    let image;
    try {
      image = await resizeToJpeg(selected.file);
    } catch (error) {
      throw new Error("写真を変換できませんでした。JPEGやPNGの写真でお試しください。", {
        cause: error,
      });
    }
    const idsForFile = uploadIds.get(selected.file) ?? new Map<string, string>();
    const imageId = idsForFile.get(logId) ?? crypto.randomUUID();
    idsForFile.set(logId, imageId);
    uploadIds.set(selected.file, idsForFile);
    const body = new FormData();
    body.append("image", image);
    body.append("imageId", imageId);
    try {
      await uploadImage(logId, body);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error("ログインの有効期限が切れました。画面を開き直してお試しください。", {
          cause: error,
        });
      }
      if (error instanceof ApiError && error.status === 400) {
        throw new Error("写真の枚数や形式を確認してください。写真は5枚まで保存できます。", {
          cause: error,
        });
      }
      throw new Error("写真を送信できませんでした。通信状況を確認してお試しください。", {
        cause: error,
      });
    }
  }
};

export const cafelogQueries = {
  all: ["cafelog"] as const,
  stores: () =>
    queryOptions({
      queryKey: ["cafelog", "stores"] as const,
      queryFn: async () => parseJson<StoresResponse>(await api.api.stores.$get()),
    }),
  store: (id: string) =>
    queryOptions({
      queryKey: ["cafelog", "stores", id] as const,
      queryFn: async () =>
        parseJson<StoreHistoryResponse>(await api.api.stores[":id"].$get({ param: { id } })),
      enabled: Boolean(id),
    }),
  logs: () =>
    queryOptions({
      queryKey: ["cafelog", "logs"] as const,
      queryFn: fetchLogs,
    }),
  log: (id: string) =>
    queryOptions({
      queryKey: ["cafelog", "logs", id] as const,
      queryFn: () => fetchLog(id),
      enabled: Boolean(id),
    }),
  images: (id: string) =>
    queryOptions({
      queryKey: ["cafelog", "logs", id, "images"] as const,
      queryFn: () => fetchLogImages(id),
      enabled: Boolean(id),
      retry: false,
    }),
};
