import { Dialog } from "@base-ui/react/dialog";
import { Download, X } from "lucide-react";
import { useRef } from "react";
import styles from "./image-preview.module.css";
export const ImagePreview = ({
  url,
  label,
  download,
  onClose,
}: {
  url: string;
  label: string;
  download?: string;
  onClose: () => void;
}) => {
  const returnFocus = useRef(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Viewport className={styles.viewport}>
          <Dialog.Popup data-image-preview className={styles.popup} finalFocus={returnFocus}>
            <div className={styles.imageArea}>
              <img src={url} alt={label} className={styles.image} />
            </div>
            {download && (
              <a href={url} download={download} className={styles.download}>
                <Download size={19} aria-hidden="true" />
                写真をダウンロード
              </a>
            )}
            <header className={styles.header}>
              <Dialog.Title className={styles.title}>{label}</Dialog.Title>
              <Dialog.Close className={styles.close} aria-label="プレビューを閉じる">
                <X size={24} aria-hidden="true" />
              </Dialog.Close>
            </header>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
