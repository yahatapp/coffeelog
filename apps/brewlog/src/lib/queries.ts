import { parseResponse } from "hono/client";
import type { ClientResponse, InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import { notify } from "@yahatapp/ui";
import { api } from "./api";

const parseOkResponse = async <T extends ClientResponse<unknown>>(responsePromise: Promise<T>) => {
  const response = await responsePromise;

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return parseResponse(response);
};

export const queryKeys = {
  beans: ["brewlog", "beans"] as const,
  bean: (id: string) => ["brewlog", "beans", id] as const,
  logs: ["brewlog", "logs"] as const,
  log: (id: string) => ["brewlog", "logs", id] as const,
  drippers: ["brewlog", "drippers"] as const,
  grinders: ["brewlog", "grinders"] as const,
  stores: ["brewlog", "stores"] as const,
};

export const storeQueries = {
  all: () =>
    queryOptions({
      queryKey: queryKeys.stores,
      queryFn: () => parseOkResponse(api.api.stores.$get()),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...queryKeys.stores, id],
      queryFn: () => parseOkResponse(api.api.stores[":id"].$get({ param: { id } })),
      enabled: Boolean(id),
    }),
};

export type BeansResponse = InferResponseType<typeof api.api.beans.$get, 200>;
export type Bean = BeansResponse[number];
export type BeanResponse = InferResponseType<(typeof api.api.beans)[":id"]["$get"], 200>;
export type LogsResponse = InferResponseType<typeof api.api.logs.$get, 200>;
export type BrewLog = LogsResponse[number];
export type BrewLogResponse = InferResponseType<(typeof api.api.logs)[":id"]["$get"], 200>;
export type DrippersResponse = InferResponseType<typeof api.api.drippers.$get, 200>;
export type Dripper = DrippersResponse[number];
export type GrindersResponse = InferResponseType<typeof api.api.grinders.$get, 200>;
export type Grinder = GrindersResponse[number];

export const beanQueries = {
  all: () =>
    queryOptions({
      queryKey: queryKeys.beans,
      queryFn: () => parseOkResponse(api.api.beans.$get()),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.bean(id),
      queryFn: () => parseOkResponse(api.api.beans[":id"].$get({ param: { id } })),
      enabled: Boolean(id),
    }),
};

export const logQueries = {
  all: () =>
    queryOptions({
      queryKey: queryKeys.logs,
      queryFn: () => parseOkResponse(api.api.logs.$get()),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.log(id),
      queryFn: () => parseOkResponse(api.api.logs[":id"].$get({ param: { id } })),
      enabled: Boolean(id),
    }),
};

export const dripperQueries = {
  all: () =>
    queryOptions({
      queryKey: queryKeys.drippers,
      queryFn: () => parseOkResponse(api.api.drippers.$get()),
    }),
};

export const grinderQueries = {
  all: () =>
    queryOptions({
      queryKey: queryKeys.grinders,
      queryFn: () => parseOkResponse(api.api.grinders.$get()),
    }),
};

export type CreateBeanRequest = InferRequestType<typeof api.api.beans.$post>;
export type UpdateBeanRequest = InferRequestType<(typeof api.api.beans)[":id"]["$patch"]>;
export type CreateLogRequest = InferRequestType<typeof api.api.logs.$post>;
export type UpdateLogRequest = InferRequestType<(typeof api.api.logs)[":id"]["$patch"]>;
export type CreateDripperRequest = InferRequestType<typeof api.api.drippers.$post>;
export type UpdateDripperRequest = InferRequestType<(typeof api.api.drippers)[":id"]["$patch"]>;
export type CreateGrinderRequest = InferRequestType<typeof api.api.grinders.$post>;
export type UpdateGrinderRequest = InferRequestType<(typeof api.api.grinders)[":id"]["$patch"]>;

const parseMutationResponse = async <T extends ClientResponse<unknown>>(
  response: Promise<T>,
  success: string,
  error: string,
) => {
  try {
    const result = await parseOkResponse(response);
    notify({ variant: "success", message: success });
    return result;
  } catch (cause) {
    notify({ variant: "error", message: error });
    throw cause;
  }
};

export const mutations = {
  createBean: (options: CreateBeanRequest) =>
    parseMutationResponse(
      api.api.beans.$post(options),
      "豆を登録しました。",
      "豆の登録に失敗しました。",
    ),
  updateBean: (options: UpdateBeanRequest) =>
    parseMutationResponse(
      api.api.beans[":id"].$patch(options),
      options.json.isArchived === true
        ? "豆をアーカイブしました。"
        : options.json.isArchived === false
          ? "豆をアーカイブから戻しました。"
          : "豆を更新しました。",
      "豆の更新に失敗しました。",
    ),
  deleteBean: (id: string) =>
    parseMutationResponse(
      api.api.beans[":id"].$delete({ param: { id } }),
      "豆を削除しました。",
      "豆の削除に失敗しました。",
    ),
  createLog: (options: CreateLogRequest) =>
    parseMutationResponse(
      api.api.logs.$post(options),
      "抽出記録を保存しました。",
      "抽出記録の保存に失敗しました。",
    ),
  updateLog: (options: UpdateLogRequest) =>
    parseMutationResponse(
      api.api.logs[":id"].$patch(options),
      "抽出記録を更新しました。",
      "抽出記録の更新に失敗しました。",
    ),
  createDripper: (options: CreateDripperRequest) =>
    parseMutationResponse(
      api.api.drippers.$post(options),
      "ドリッパーを登録しました。",
      "ドリッパーの登録に失敗しました。",
    ),
  updateDripper: (options: UpdateDripperRequest) =>
    parseMutationResponse(
      api.api.drippers[":id"].$patch(options),
      options.json.isDefault === true
        ? "デフォルトのドリッパーを設定しました。"
        : "ドリッパーを更新しました。",
      "ドリッパーの更新に失敗しました。",
    ),
  deleteDripper: (id: string) =>
    parseMutationResponse(
      api.api.drippers[":id"].$delete({ param: { id } }),
      "ドリッパーを削除しました。",
      "ドリッパーの削除に失敗しました。",
    ),
  createGrinder: (options: CreateGrinderRequest) =>
    parseMutationResponse(
      api.api.grinders.$post(options),
      "グラインダーを登録しました。",
      "グラインダーの登録に失敗しました。",
    ),
  updateGrinder: (options: UpdateGrinderRequest) =>
    parseMutationResponse(
      api.api.grinders[":id"].$patch(options),
      options.json.isDefault === true
        ? "デフォルトのグラインダーを設定しました。"
        : "グラインダーを更新しました。",
      "グラインダーの更新に失敗しました。",
    ),
  deleteGrinder: (id: string) =>
    parseMutationResponse(
      api.api.grinders[":id"].$delete({ param: { id } }),
      "グラインダーを削除しました。",
      "グラインダーの削除に失敗しました。",
    ),
};
