const MAX_DIMENSION = 1600;
const MAX_BYTES = 1024 * 1024;

const canvasBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("画像をJPEGに変換できませんでした。"))),
      "image/jpeg",
      quality,
    ),
  );

export const resizeToJpeg = async (file: File): Promise<File> => {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を処理できませんでした。");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let quality = 0.85;
    let blob = await canvasBlob(canvas, quality);
    while (blob.size > MAX_BYTES && quality > 0.35) {
      quality -= 0.1;
      blob = await canvasBlob(canvas, quality);
    }
    if (blob.size > MAX_BYTES) throw new Error("画像を1MB以下に縮小できませんでした。");
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, {
      type: "image/jpeg",
    });
  } finally {
    bitmap.close();
  }
};
