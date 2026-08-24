import { parseResponse } from "hono/client";
import type { ClientResponse, InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
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

export const mutations = {
  createBean: (options: CreateBeanRequest) => parseOkResponse(api.api.beans.$post(options)),
  updateBean: (options: UpdateBeanRequest) => parseOkResponse(api.api.beans[":id"].$patch(options)),
  createLog: (options: CreateLogRequest) => parseOkResponse(api.api.logs.$post(options)),
  updateLog: (options: UpdateLogRequest) => parseOkResponse(api.api.logs[":id"].$patch(options)),
  createDripper: (options: CreateDripperRequest) =>
    parseOkResponse(api.api.drippers.$post(options)),
  updateDripper: (options: UpdateDripperRequest) =>
    parseOkResponse(api.api.drippers[":id"].$patch(options)),
  deleteDripper: (id: string) =>
    parseOkResponse(api.api.drippers[":id"].$delete({ param: { id } })),
  createGrinder: (options: CreateGrinderRequest) =>
    parseOkResponse(api.api.grinders.$post(options)),
  updateGrinder: (options: UpdateGrinderRequest) =>
    parseOkResponse(api.api.grinders[":id"].$patch(options)),
  deleteGrinder: (id: string) =>
    parseOkResponse(api.api.grinders[":id"].$delete({ param: { id } })),
};
