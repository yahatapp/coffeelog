import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Images } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorState, Loading } from "@yahatapp/ui";
import { cafelogQueries } from "@/lib/queries";
import { ImagePreview } from "./ImagePreview";
import styles from "./log-images.module.css";
type LoadedImage = { id: string; position: number; url: string };
const emptyImages: never[] = [];
export const LogImages = ({
  logId,
  onCountChange,
  collapsible = false,
}: {
  logId: string;
  onCountChange?: (count: number) => void;
  collapsible?: boolean;
}) => {
  const query = useQuery(cafelogQueries.images(logId));
  const data = query.data ?? emptyImages;
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  useEffect(() => {
    onCountChange?.(data.length);
    const urls = data.map((image) => ({
      id: image.id,
      position: image.position,
      url: URL.createObjectURL(image.blob),
    }));
    // Object URLs belong to this effect and are revoked when its data changes.
    // eslint-disable-next-line react/set-state-in-effect
    setImages(urls);
    return () => urls.forEach((image) => URL.revokeObjectURL(image.url));
  }, [data, onCountChange]);
  if (query.isPending) return <Loading label="写真を読み込み中..." />;
  if (query.isError)
    return (
      <ErrorState message="写真を取得できませんでした。" onRetry={() => void query.refetch()} />
    );
  if (!images.length) return null;
  const preview = previewIndex === null ? null : images[previewIndex];
  const gallery = (
    <section aria-label="記録の写真" className={styles.gallery}>
      {images.map((image, index) => (
        <button
          key={image.id}
          type="button"
          className={styles.photo}
          data-single={images.length === 1 || undefined}
          onClick={() => setPreviewIndex(index)}
          aria-label={`記録の写真 ${index + 1} を拡大表示`}
        >
          <img src={image.url} alt={`記録の写真 ${index + 1}`} className={styles.image} />
        </button>
      ))}
    </section>
  );
  return (
    <>
      {collapsible ? (
        <details className={styles.details}>
          <summary className={styles.summary}>
            <Images size={17} aria-hidden="true" />
            写真<span className={styles.count}>{images.length}枚</span>
            <ChevronDown size={17} aria-hidden="true" className={styles.chevron} />
          </summary>
          <div className={styles.content}>{gallery}</div>
        </details>
      ) : (
        gallery
      )}
      {preview && (
        <ImagePreview
          url={preview.url}
          label={`記録の写真 ${(previewIndex ?? 0) + 1} のプレビュー`}
          download={`cafelog-${logId}-${preview.position + 1}.jpg`}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </>
  );
};
