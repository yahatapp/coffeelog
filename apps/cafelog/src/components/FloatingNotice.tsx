import { noticeStore, notify } from "@yahatapp/ui";
import { useEffect } from "react";

export const FloatingNotice = ({
  message,
  warning = false,
}: {
  message: string;
  warning?: boolean;
}) => {
  useEffect(() => {
    const id = notify({ message, variant: warning ? "warning" : "error" });
    return () => noticeStore.dismiss(id);
  }, [message, warning]);

  return null;
};
