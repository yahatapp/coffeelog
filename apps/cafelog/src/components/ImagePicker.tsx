import { useEffect, useId, useRef, useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import { Button } from "@yahatapp/ui";
import { ImagePreview } from "./ImagePreview";
import { analytics } from "@/lib/analytics";
import styles from "./image-picker.module.css";
export type SelectedImage = { file: File; previewUrl: string };
export const ImagePicker = ({
  images,
  onChange,
  onError,
  maxImages = 5,
}: {
  images: SelectedImage[];
  onChange: (images: SelectedImage[]) => void;
  onError: (message: string | null) => void;
  maxImages?: number;
}) => {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    [],
  );
  const select = (files: FileList | null) => {
    if (!files) return;
    onError(null);
    const available = Math.max(0, maxImages - images.length);
    if (files.length > available) onError("写真は1つの記録につき5枚までです。");
    const additions = Array.from(files)
      .slice(0, available)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    if (additions.length > 0) analytics.trackEvent("photo_add");
    onChange([...images, ...additions]);
  };
  const remove = (index: number) => {
    URL.revokeObjectURL(images[index].previewUrl);
    onChange(images.filter((_, current) => current !== index));
  };
  const preview = previewIndex === null ? null : images[previewIndex];
  return (
    <section className={styles.root} aria-labelledby={`${id}-heading`}>
      <div className={styles.header}>
        <h3 id={`${id}-heading`} className={styles.heading}>
          <Camera size={15} aria-hidden="true" />
          写真
        </h3>
        <span className={styles.count} aria-live="polite">
          {images.length} / {maxImages}枚
        </span>
      </div>
      <div className={styles.grid}>
        {images.map((image, index) => (
          <div key={image.previewUrl} className={styles.tile}>
            <button
              type="button"
              className={styles.preview}
              aria-label={`選択した写真 ${index + 1} を拡大表示`}
              onClick={() => setPreviewIndex(index)}
            >
              <img
                src={image.previewUrl}
                alt={`選択した写真 ${index + 1}`}
                className={styles.image}
              />
            </button>
            <div className={styles.remove}>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => remove(index)}
                aria-label={`写真 ${index + 1} を削除`}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className={styles.add}
            aria-label="写真を追加"
            aria-describedby={`${id}-hint`}
          >
            <Plus size={22} aria-hidden="true" />
            <span>追加</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        id={id}
        aria-label="写真を選択"
        className={styles.file}
        tabIndex={-1}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          select(event.target.files);
          event.target.value = "";
        }}
      />
      <p id={`${id}-hint`} className={styles.hint}>
        写真は保存時に、端末内で長辺1600px・JPEG（1MB以下）に縮小します。
      </p>
      {preview && (
        <ImagePreview
          url={preview.previewUrl}
          label={`選択した写真 ${(previewIndex ?? 0) + 1} のプレビュー`}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </section>
  );
};
