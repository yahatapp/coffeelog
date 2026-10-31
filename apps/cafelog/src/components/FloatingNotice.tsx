import { useNotice } from "@yahatapp/ui";
import { useEffect } from "react";

export const FloatingNotice = ({
  message,
  warning = false,
}: {
  message: string;
  warning?: boolean;
}) => {
  const { notify, close } = useNotice();
  useEffect(() => {
    const id = notify({ message, variant: warning ? "warning" : "error" });
    return () => close(id);
  }, [message, warning, notify, close]);

  return null;
};
