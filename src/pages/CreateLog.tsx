import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, authorizedFetch } from "@/lib/api";
import { resizeToJpeg } from "@/lib/images";
import { ImagePicker, type SelectedImage } from "@/components/ImagePicker";
import { getErrorMessage } from "@/lib/errors";
import { ProcessField } from "@/components/ProcessField";
import { Switch } from "@/components/Switch";
import { ArrowLeft, Star, Calendar, MessageSquare, Save, Loader2, Minus, Plus } from "lucide-react";

const CreateLogPage = () => {
  const navigate = useNavigate();
  const [cafeName, setCafeName] = useState("");
  const [cafeUrl, setCafeUrl] = useState("");
  const [origin, setOrigin] = useState("");
  const [region, setRegion] = useState("");
  const [variety, setVariety] = useState("");
  const [farm, setFarm] = useState("");
  const [process, setProcess] = useState("");
  const [roast, setRoast] = useState("");
  const [isBlend, setIsBlend] = useState(false);
  const [servingStyle, setServingStyle] = useState<"hot" | "iced" | null>(null);
  const [rating, setRating] = useState<number | null>(3);
  const [price, setPrice] = useState("");
  const [visitDate, setVisitDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [note, setNote] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderStars = (val: number | null) => {
    if (val === null) return null;
    const stars = [];
    const fullStars = Math.floor(val);
    const hasHalf = val % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={24} className="fill-cafe-accent text-cafe-accent" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={24} className="text-cafe-secondary/20" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={24} className="fill-cafe-accent text-cafe-accent" />
            </div>
          </div>,
        );
      } else {
        stars.push(<Star key={i} size={24} className="text-cafe-secondary/20" />);
      }
    }
    return <div className="flex items-center space-x-1">{stars}</div>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeName.trim()) {
      setError("店舗名は必須項目です。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedPrice = price.trim() === "" ? null : parseInt(price, 10);
      if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0)) {
        setError("金額には正の整数を入力してください。");
        setIsSubmitting(false);
        return;
      }

      const res = await api.api.logs.$post({
        json: {
          cafeName: cafeName.trim(),
          cafeUrl: cafeUrl.trim() || null,
          origin: origin.trim() || null,
          region: region.trim() || null,
          variety: variety.trim() || null,
          farm: farm.trim() || null,
          process: process.trim() || null,
          roast: roast.trim() || null,
          isBlend,
          servingStyle,
          rating: rating,
          price: parsedPrice,
          note: note.trim() || null,
          visitDate: visitDate || null,
        },
      });

      if (res.ok) {
        const newLog = await res.json();
        try {
          for (const selected of images) {
            const image = await resizeToJpeg(selected.file);
            const form = new FormData();
            form.append("image", image);
            const upload = await authorizedFetch(`/api/logs/${newLog.id}/images`, {
              method: "POST",
              body: form,
            });
            if (!upload.ok) throw new Error("写真のアップロードに失敗しました。");
          }
          void navigate("/logs");
        } catch (uploadError: unknown) {
          console.error("Error uploading images", uploadError);
          void navigate(`/logs/${newLog.id}`, {
            state: {
              edit: true,
              photoUploadError: getErrorMessage(
                uploadError,
                "記録は保存されましたが、写真のアップロードに失敗しました。",
              ),
            },
          });
        }
      } else {
        console.error("Failed to save log", res.status);
        const errorText = await res.text();
        setError(`保存に失敗しました。(${errorText})`);
      }
    } catch (err: unknown) {
      console.error("Error saving log", err);
      setError(getErrorMessage(err, "通信エラーが発生しました。"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link
          to="/logs"
          className="p-1.5 hover:bg-cafe-primary/5 text-cafe-secondary hover:text-cafe-primary rounded-lg transition-all"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-cafe-text">記録を追加</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-xl font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-cafe-text block mb-1.5">
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={cafeName}
              onChange={(e) => setCafeName(e.target.value)}
              placeholder="例: ブルーボトルコーヒー"
              className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
            />
          </div>

          <Switch
            checked={isBlend}
            onCheckedChange={setIsBlend}
            checkedLabel="ブレンド"
            uncheckedLabel="シングル"
            ariaLabel="ブレンドとシングルを切り替える"
          />

          <div>
            <label className="text-xs font-bold text-cafe-text block mb-1.5">お店のURL</label>
            <input
              type="url"
              value={cafeUrl}
              onChange={(e) => setCafeUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-cafe-text block mb-1.5">原産国</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="例: エチオピア"
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-text block mb-1.5">品種</label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="例: ゲイシャ"
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-cafe-text block mb-1.5">地域</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="例: シダマ"
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-cafe-text block mb-1.5">農園</label>
              <input
                type="text"
                value={farm}
                onChange={(e) => setFarm(e.target.value)}
                placeholder="例: コピア農園"
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="create-process"
                className="text-xs font-bold text-cafe-text block mb-1.5"
              >
                精製方法
              </label>
              <ProcessField id="create-process" value={process} onChange={setProcess} />
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-text block mb-1.5">焙煎度</label>
              <input
                type="text"
                value={roast}
                onChange={(e) => setRoast(e.target.value)}
                placeholder="例: 浅煎り"
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-cafe-text block mb-2">提供温度</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "ホット", value: "hot" as const },
                { label: "アイス", value: "iced" as const },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setServingStyle(option.value)}
                  aria-pressed={servingStyle === option.value}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
                    servingStyle === option.value
                      ? "border-cafe-primary bg-cafe-primary text-white shadow-sm"
                      : "border-cafe-secondary/20 bg-cafe-background text-cafe-secondary hover:border-cafe-primary/40 hover:bg-cafe-primary/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-cafe-text block mb-2">評価</label>
            <div className="flex items-center justify-between bg-cafe-background border border-cafe-secondary/15 rounded-2xl p-3.5 w-full shadow-inner">
              <button
                type="button"
                onClick={() => setRating((prev) => (prev !== null ? Math.max(0.5, prev - 0.5) : 3))}
                disabled={rating !== null && rating <= 0.5}
                className="w-10 h-10 rounded-xl bg-white border border-cafe-secondary/20 flex items-center justify-center text-cafe-primary hover:bg-cafe-primary/5 active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white transition-all shadow-sm"
              >
                <Minus size={18} />
              </button>

              <div className="flex flex-col items-center justify-center px-4 min-w-[130px]">
                <div className="flex items-center">{renderStars(rating)}</div>
                <div className="inline-flex items-baseline mt-1">
                  <span className="text-xl font-extrabold text-cafe-primary leading-none">
                    {rating !== null ? rating.toFixed(1) : "3.0"}
                  </span>
                  <span className="text-[10px] font-bold text-cafe-secondary/50 mx-0.5">/</span>
                  <span className="text-[10px] font-bold text-cafe-secondary">5.0</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRating((prev) => (prev !== null ? Math.min(5.0, prev + 0.5) : 3))}
                disabled={rating !== null && rating >= 5.0}
                className="w-10 h-10 rounded-xl bg-white border border-cafe-secondary/20 flex items-center justify-center text-cafe-primary hover:bg-cafe-primary/5 active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-cafe-text block mb-1.5">金額 (円)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-cafe-secondary">
                  ¥
                </span>
                <input
                  type="number"
                  pattern="[0-9]*"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="550"
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl pl-8 pr-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-text block mb-1.5">訪問日</label>
              <div className="relative">
                <Calendar
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cafe-secondary pointer-events-none"
                  size={16}
                />
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all select-none appearance-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-cafe-text block mb-1.5">メモ / 味の感想</label>
            <div className="relative">
              <MessageSquare
                className="absolute left-3.5 top-3.5 text-cafe-secondary/40"
                size={16}
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="味の特徴、豆の情報、お店の雰囲気など..."
                rows={4}
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl pl-9 pr-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all resize-none"
              />
            </div>
          </div>

          <ImagePicker images={images} onChange={setImages} onError={setError} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-cafe-primary text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:bg-cafe-primary/95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>保存中...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>この内容で保存する</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateLogPage;
