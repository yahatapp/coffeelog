import { queryOptions } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono/client";
import { api, assertOk, authorizedFetch } from "@/lib/api";
import { resizeToJpeg } from "@/lib/images";
import { toCafeLogPayload, type CafeLogFormValues } from "@/lib/cafeLogForm";

export type LogsResponse = InferResponseType<typeof api.api.logs.$get>;
export type LogResponse = InferResponseType<(typeof api.api.logs)[":id"]["$get"]>;
export type CreateLogInput = InferRequestType<typeof api.api.logs.$post>["json"];
export type UpdateLogInput = InferRequestType<(typeof api.api.logs)[":id"]["$patch"]>["json"];

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

export const uploadLogImages = async (logId: string, images: CafeLogFormValues["images"]) => {
  for (const selected of images) {
    const image = await resizeToJpeg(selected.file);
    const body = new FormData();
    body.append("image", image);
    const response = await authorizedFetch(`/api/logs/${logId}/images`, {
      method: "POST",
      body,
    });
    await assertOk(response);
  }
};

export const cafelogQueries = {
  all: ["cafelog"] as const,
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
