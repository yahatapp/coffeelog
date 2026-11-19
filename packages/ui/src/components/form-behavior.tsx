import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useBlocker } from "react-router-dom";
import { Button } from "./button";
import styles from "./form-behavior.module.css";

export function useUnsavedChanges(
  isDirty: () => boolean,
  isPending: () => boolean,
  saved: RefObject<boolean>,
) {
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const blockedDuringSave = useRef(false);
  const blocker = useBlocker(() => {
    if (saved.current) return false;
    blockedDuringSave.current = isPending();
    return blockedDuringSave.current || isDirty();
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!saved.current && (isDirty() || isPending())) {
        event.preventDefault();
        event.returnValue = true;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isPending, saved]);

  const blocked = blocker.state === "blocked";
  const confirmNavigation = blocked && !blockedDuringSave.current;
  useEffect(() => {
    if (blocker.state === "blocked" && blockedDuringSave.current) {
      blocker.reset();
      blockedDuringSave.current = false;
    }
  }, [blocker]);

  const close = () => {
    if (blocker.state === "blocked") blocker.reset();
    setDiscard(null);
  };

  return {
    cancel: (action: () => void) => {
      if (isPending()) return;
      if (isDirty()) setDiscard(() => action);
      else action();
    },
    confirmation: (
      <AlertDialog.Root
        open={confirmNavigation || discard !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.backdrop} />
          <AlertDialog.Popup className={styles.dialog}>
            <AlertDialog.Title className={styles.title}>入力内容を破棄しますか？</AlertDialog.Title>
            <AlertDialog.Description>保存していない変更が失われます。</AlertDialog.Description>
            <div className={styles.actions}>
              <Button type="button" variant="outline" onClick={close}>
                入力を続ける
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (blocker.state === "blocked") blocker.proceed();
                  else discard?.();
                  setDiscard(null);
                }}
              >
                破棄する
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ),
  };
}

export function focusFirstInvalidField(form: HTMLFormElement) {
  requestAnimationFrame(() => {
    if (!form.isConnected) return;
    const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalid?.closest("details")?.setAttribute("open", "");
    invalid?.focus({ preventScroll: true });
    invalid?.scrollIntoView({ block: "center" });
  });
}

export function FormNotice({ message, warning = false }: { message: string; warning?: boolean }) {
  return (
    <p className={warning ? styles.warning : styles.error} role={warning ? "status" : "alert"}>
      {message}
    </p>
  );
}
