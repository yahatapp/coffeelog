import { useEffect, useRef } from "react";
import { Camera, Plus, X } from "lucide-react";

export type SelectedImage = { file: File; previewUrl: string };

export const ImagePicker = ({
  images,
  onChange,
  onError,
  maxImages = 5,
}: {
  images: SelectedImage[];
  onChange: (images: SelectedImage[]) => void;
  onError: (message: string) => void;
  maxImages?: number;
}) => {
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(
    () => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    [],
  );

  const select = (files: FileList | null) => {
    if (!files) return;
    const available = maxImages - images.length;
    if (files.length > available) onError("写真は1つの記録につき5枚までです。");
    const additions = Array.from(files)
      .slice(0, available)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    onChange([...images, ...additions]);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(images[index].previewUrl);
    onChange(images.filter((_, current) => current !== index));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="log-images"
          className="flex items-center gap-1.5 text-xs font-bold text-cafe-text"
        >
          <Camera size={15} /> 写真
        </label>
        <span className="text-xs font-semibold text-cafe-secondary">
          {images.length} / {maxImages}枚
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <div
            key={image.previewUrl}
            className="relative aspect-square overflow-hidden rounded-xl bg-cafe-background"
          >
            <img
              src={image.previewUrl}
              alt={`選択した写真 ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`写真 ${index + 1} を削除`}
              className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <label
            htmlFor="log-images"
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cafe-secondary/30 bg-cafe-background text-cafe-secondary hover:border-cafe-primary"
          >
            <Plus size={22} />
            <span className="text-[11px] font-bold">追加</span>
          </label>
        )}
      </div>
      <input
        id="log-images"
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          select(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="text-[11px] text-cafe-secondary">
        選択した写真は端末内で長辺1600px・JPEG（1MB以下）に縮小してから保存します。
      </p>
    </section>
  );
};
