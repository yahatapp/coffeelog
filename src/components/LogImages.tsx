import { useEffect, useState } from "react";
import { authorizedFetch } from "@/lib/api";

type ImageMeta = { id: string; position: number };

export const LogImages = ({ logId }: { logId: string }) => {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const objectUrls: string[] = [];
    const load = async () => {
      const metadata = await authorizedFetch(`/api/logs/${logId}/images`);
      if (!metadata.ok) return;
      const images = (await metadata.json()) as ImageMeta[];
      const loaded = await Promise.all(
        images.map(async (image) => {
          const response = await authorizedFetch(`/api/logs/${logId}/images/${image.id}`);
          if (!response.ok) return null;
          const url = URL.createObjectURL(await response.blob());
          objectUrls.push(url);
          return url;
        }),
      );
      setUrls(loaded.filter((url): url is string => url !== null));
    };
    void load();
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [logId]);
  if (!urls.length) return null;
  return (
    <section aria-label="記録の写真" className="grid grid-cols-2 gap-2">
      {urls.map((url, index) => (
        <button
          key={url}
          type="button"
          className={urls.length === 1 ? "col-span-2" : ""}
          onClick={() => window.open(url, "_blank")}
        >
          <img
            src={url}
            alt={`記録の写真 ${index + 1}`}
            className="aspect-square w-full rounded-2xl object-cover shadow-sm"
          />
        </button>
      ))}
    </section>
  );
};
