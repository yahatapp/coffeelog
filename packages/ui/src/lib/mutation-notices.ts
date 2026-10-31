import { MutationCache } from "@tanstack/react-query";
import { notify, type Notice } from "./notices";

export type MutationNoticeMeta = Record<string, unknown> & {
  notice?: {
    success?: string;
    error: string | ((error: Error) => string);
  };
};

// A workflow can override its success notice, for example when only photos failed to save.
export type MutationNoticeResult<T> = { data: T; notice?: Notice };

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: MutationNoticeMeta;
  }
}

const getResultNotice = (result: unknown): Notice | undefined => {
  if (!result || typeof result !== "object" || !("notice" in result)) return;
  const notice = result.notice;
  if (
    notice &&
    typeof notice === "object" &&
    "message" in notice &&
    typeof notice.message === "string" &&
    "variant" in notice &&
    (notice.variant === "success" || notice.variant === "warning" || notice.variant === "error")
  ) {
    return { message: notice.message, variant: notice.variant };
  }
};

export const createMutationNoticeCache = () =>
  new MutationCache({
    onSuccess: (data, _variables, _context, mutation) => {
      const config = mutation.meta?.notice;
      if (!config) return;
      const notice = getResultNotice(data);
      if (notice) notify(notice);
      else if (config.success) notify({ variant: "success", message: config.success });
    },
    onError: (error, _variables, _context, mutation) => {
      const config = mutation.meta?.notice;
      if (!config) return;
      notify({
        variant: "error",
        message: typeof config.error === "function" ? config.error(error) : config.error,
      });
    },
  });
