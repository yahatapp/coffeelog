import { useCallback } from "react";
import { Toast } from "@base-ui/react/toast";

export type NoticeVariant = "success" | "warning" | "error";
export type Notice = { message: string; variant: NoticeVariant };

export const noticeManager = Toast.createToastManager<Record<string, never>>();

const options = ({ message, variant }: Notice) => ({
  title: message,
  type: variant,
  timeout: variant === "success" ? 5000 : 0,
  priority: variant === "success" ? ("low" as const) : ("high" as const),
});

export const notify = (notice: Notice) => noticeManager.add(options(notice));

export const useNotice = () => {
  const { add, close } = Toast.useToastManager<Record<string, never>>();
  const notify = useCallback((notice: Notice) => add(options(notice)), [add]);
  return { notify, close };
};
