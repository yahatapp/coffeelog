import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { authorizedFetch } from "@/lib/api";

type ImageMeta = { id: string; position: number };
type LoadedImage = ImageMeta & { url: string };

export const LogImages = ({
  logId,
  refreshKey = 0,
  onCountChange,
}: {
  logId: string;
  refreshKey?: number;
  onCountChange?: (count: number) => void;
}) => {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  useEffect(() => {
    const objectUrls: string[] = [];
    const load = async () => {
      const metadata = await authorizedFetch(`/api/logs/${logId}/images`);
      if (!metadata.ok) return;
      const images = (await metadata.json()) as ImageMeta[];
      onCountChange?.(images.length);
      const loaded = await Promise.all(
        images.map(async (image) => {
          const response = await authorizedFetch(`/api/logs/${logId}/images/${image.id}`);
          if (!response.ok) return null;
          const url = URL.createObjectURL(await response.blob());
          objectUrls.push(url);
          return { ...image, url };
        }),
      );
      setImages(loaded.filter((image): image is LoadedImage => image !== null));
    };
    void load();
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [logId, refreshKey, onCountChange]);

  useEffect(() => {
    if (previewIndex === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewIndex(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [previewIndex]);

  if (!images.length) return null;
  const preview = previewIndex === null ? null : images[previewIndex];
  const previewNumber = previewIndex === null ? 0 : previewIndex + 1;
  return (
    <>
      <section aria-label="記録の写真" className="grid grid-cols-2 gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={images.length === 1 ? "col-span-2" : ""}
            onClick={() => setPreviewIndex(index)}
            aria-label={`記録の写真 ${index + 1} を拡大表示`}
          >
            <img
              src={image.url}
              alt={`記録の写真 ${index + 1}`}
              className="aspect-square w-full rounded-2xl object-cover shadow-sm"
            />
          </button>
        ))}
      </section>

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`記録の写真 ${previewNumber} のプレビュー`}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={() => setPreviewIndex(null)}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              aria-label="プレビューを閉じる"
              className="rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            <img
              src={preview.url}
              alt={`記録の写真 ${previewNumber}`}
              className="max-h-full max-w-full object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          <a
            href={preview.url}
            download={`cafelog-${logId}-${preview.position + 1}.jpg`}
            onClick={(event) => event.stopPropagation()}
            className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-cafe-text"
          >
            <Download size={19} />
            写真をダウンロード
          </a>
        </div>
      )}
    </>
  );
};
