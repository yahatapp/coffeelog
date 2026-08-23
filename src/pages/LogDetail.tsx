import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { api, authorizedFetch } from "@/lib/api";
import { resizeToJpeg } from "@/lib/images";
import { ImagePicker, type SelectedImage } from "@/components/ImagePicker";
import { getErrorMessage } from "@/lib/errors";
import { ProcessField } from "@/components/ProcessField";
import { Switch } from "@/components/Switch";
import { LogImages } from "@/components/LogImages";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  MessageSquare,
  Save,
  X,
  Star,
  Loader2,
  Coffee,
  Minus,
  Plus,
  ExternalLink,
} from "lucide-react";
import type { InferResponseType } from "hono/client";

type LogResponse = InferResponseType<(typeof api.api.logs)[":id"]["$get"]>;

const formatCoffeeInfo = (log: {
  origin?: string | null;
  region?: string | null;
  variety?: string | null;
  farm?: string | null;
  process?: string | null;
  roast?: string | null;
  isBlend?: boolean | null;
  servingStyle?: string | null;
}) => {
  const parts = [];
  if (log.origin) parts.push(log.origin);
  if (log.region) parts.push(log.region);
  if (log.farm) parts.push(log.farm);
  if (log.variety) parts.push(log.variety);

  let base = parts.join(" ");

  const tags = [];
  if (log.process) tags.push(log.process);
  if (log.roast) tags.push(log.roast);
  if (log.isBlend !== null && log.isBlend !== undefined) {
    tags.push(log.isBlend ? "ブレンド" : "シングル");
  }
  if (log.servingStyle) tags.push(log.servingStyle === "hot" ? "ホット" : "アイス");

  if (tags.length > 0) {
    base += ` (${tags.join(" / ")})`;
  }

  return base.trim() || "豆の詳細情報なし";
};

const LogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as { edit?: boolean; photoUploadError?: string } | null;

  const [log, setLog] = useState<LogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(navigationState?.edit ?? false);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
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
  const [visitDate, setVisitDate] = useState("");
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(
    navigationState?.photoUploadError ?? null,
  );

  useEffect(() => {
    const fetchLogDetails = async () => {
      if (!id) return;
      try {
        const res = await api.api.logs[":id"].$get({ param: { id } });
        if (res.ok) {
          const data = await res.json();
          setLog(data);
          // Initialize edit form states
          setCafeName(data.cafeName);
          setCafeUrl(data.cafeUrl || "");
          setOrigin(data.origin || "");
          setRegion(data.region || "");
          setVariety(data.variety || "");
          setFarm(data.farm || "");
          setProcess(data.process || "");
          setRoast(data.roast || "");
          setIsBlend(data.isBlend ?? false);
          setServingStyle(
            data.servingStyle === "hot" || data.servingStyle === "iced" ? data.servingStyle : null,
          );
          setRating(data.rating);
          setPrice(data.price !== null && data.price !== undefined ? String(data.price) : "");
          setVisitDate(data.visitDate || "");
          setNote(data.note || "");
        } else {
          console.error("Failed to fetch log details", res.status);
          if (res.status === 404) {
            setError("お探しの記録が見つかりませんでした。");
          } else {
            setError("詳細情報の取得に失敗しました。");
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching log details", err);
        setError(getErrorMessage(err, "通信エラーが発生しました。"));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLogDetails();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !cafeName.trim()) {
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

      const res = await api.api.logs[":id"].$patch({
        param: { id },
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
        const updatedLog = await res.json();
        setLog((current) => (current ? { ...current, ...updatedLog } : current));
        try {
          for (const selected of images) {
            const image = await resizeToJpeg(selected.file);
            const form = new FormData();
            form.append("image", image);
            const upload = await authorizedFetch(`/api/logs/${id}/images`, {
              method: "POST",
              body: form,
            });
            if (!upload.ok) throw new Error("写真のアップロードに失敗しました。");
            URL.revokeObjectURL(selected.previewUrl);
            setImages((current) => current.filter((item) => item !== selected));
            setImageCount((count) => count + 1);
          }
          setPhotoUploadError(null);
          setImageRefreshKey((key) => key + 1);
          setIsEditMode(false);
        } catch (uploadError: unknown) {
          console.error("Error uploading images", uploadError);
          setPhotoUploadError(getErrorMessage(uploadError, "写真のアップロードに失敗しました。"));
        }
      } else {
        console.error("Failed to update log", res.status);
        const errorText = await res.text();
        setError(`更新に失敗しました。(${errorText})`);
      }
    } catch (err: unknown) {
      console.error("Error updating log", err);
      setError(getErrorMessage(err, "通信エラーが発生しました。"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const res = await api.api.logs[":id"].$delete({ param: { id } });
      if (res.ok) {
        void navigate("/logs");
      } else {
        console.error("Failed to delete log", res.status);
        const errorText = await res.text();
        setError(`削除に失敗しました。(${errorText})`);
        setIsSubmitting(false);
        setShowDeleteConfirm(false);
      }
    } catch (err: unknown) {
      console.error("Error deleting log", err);
      setError(getErrorMessage(err, "通信エラーが発生しました。"));
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const renderStars = (val: number | null | undefined, size = 16) => {
    if (val === null || val === undefined)
      return <span className="text-xs text-cafe-secondary/40">評価なし</span>;
    const stars = [];
    const fullStars = Math.floor(val);
    const hasHalf = val % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={size} className="fill-cafe-accent text-cafe-accent" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={size} className="text-cafe-secondary/20" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={size} className="fill-cafe-accent text-cafe-accent" />
            </div>
          </div>,
        );
      } else {
        stars.push(<Star key={i} size={size} className="text-cafe-secondary/20" />);
      }
    }
    return <div className="flex items-center space-x-0.5">{stars}</div>;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "未設定";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-cafe-primary mb-4" size={32} />
        <p className="text-cafe-secondary text-sm">記録を読み込み中...</p>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="space-y-4 text-center py-10">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 shadow-sm">
          <p className="text-red-500 font-semibold mb-6">
            {error || "データが見つかりませんでした。"}
          </p>
          <Link
            to="/logs"
            className="inline-flex items-center space-x-2 bg-cafe-primary text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:bg-cafe-primary/90 transition-all active:scale-95 text-sm"
          >
            <ArrowLeft size={16} />
            <span>一覧へ戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            to="/logs"
            className="p-1.5 hover:bg-cafe-primary/5 text-cafe-secondary hover:text-cafe-primary rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-xl font-bold text-cafe-text">記録の詳細</h2>
        </div>

        {!isEditMode && !showDeleteConfirm && (
          <div className="flex space-x-1.5">
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 text-cafe-secondary hover:text-cafe-primary hover:bg-cafe-primary/5 rounded-xl active:scale-95 transition-all"
              title="編集"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl active:scale-95 transition-all"
              title="削除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-xl font-semibold">
          {error}
        </div>
      )}

      {photoUploadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-4 rounded-xl font-semibold">
          記録は保存済みです。{photoUploadError} 写真を選び直して保存してください。
        </div>
      )}

      {id && <LogImages logId={id} refreshKey={imageRefreshKey} onCountChange={setImageCount} />}

      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-250">
          <div className="space-y-1">
            <h4 className="text-red-700 font-bold text-sm">記録を削除しますか？</h4>
            <p className="text-xs text-red-600 leading-relaxed">
              この操作は取り消せません。&ldquo;{log.cafeName} ({formatCoffeeInfo(log)})&rdquo;
              の記録を本当に削除してもよろしいですか？
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "削除中..." : "削除する"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-red-50 border border-red-200 text-red-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {isEditMode ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 shadow-sm space-y-4">
            <ImagePicker
              images={images}
              onChange={setImages}
              onError={setPhotoUploadError}
              maxImages={Math.max(0, 5 - imageCount)}
            />
            <div>
              <label className="text-xs font-bold text-cafe-text block mb-1.5">
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cafeName}
                onChange={(e) => setCafeName(e.target.value)}
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
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
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-text block mb-1.5">品種</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
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
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-cafe-text block mb-1.5">農園</label>
                <input
                  type="text"
                  value={farm}
                  onChange={(e) => setFarm(e.target.value)}
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-process"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  精製方法
                </label>
                <ProcessField id="edit-process" value={process} onChange={setProcess} />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-text block mb-1.5">焙煎度</label>
                <input
                  type="text"
                  value={roast}
                  onChange={(e) => setRoast(e.target.value)}
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-text block mb-2">評価</label>
              <div className="flex items-center justify-between bg-cafe-background border border-cafe-secondary/15 rounded-2xl p-3.5 w-full shadow-inner">
                <button
                  type="button"
                  onClick={() =>
                    setRating((prev) => (prev !== null ? Math.max(0.5, prev - 0.5) : 3))
                  }
                  disabled={rating !== null && rating <= 0.5}
                  className="w-10 h-10 rounded-xl bg-white border border-cafe-secondary/20 flex items-center justify-center text-cafe-primary hover:bg-cafe-primary/5 active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white transition-all shadow-sm"
                >
                  <Minus size={18} />
                </button>

                <div className="flex flex-col items-center justify-center px-4 min-w-[130px]">
                  <div className="flex items-center">
                    {renderStars(rating !== null ? rating : 0, 24)}
                  </div>
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
                  onClick={() =>
                    setRating((prev) => (prev !== null ? Math.min(5.0, prev + 0.5) : 3))
                  }
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
                    className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl pl-8 pr-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                  />
                </div>
              </div>

              <div className="col-span-2">
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
              <label className="text-xs font-bold text-cafe-text block mb-1.5">
                メモ / 味の感想
              </label>
              <div className="relative">
                <MessageSquare
                  className="absolute left-3.5 top-3.5 text-cafe-secondary/40"
                  size={16}
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl pl-9 pr-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-cafe-primary text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:bg-cafe-primary/95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>保存する</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-cafe-primary/5 border border-cafe-secondary/20 text-cafe-secondary font-semibold py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <X size={18} />
              <span>キャンセル</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/15 p-6 shadow-sm space-y-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-cafe-primary/5 rounded-2xl text-cafe-primary border border-cafe-primary/10 flex-shrink-0">
              <Coffee size={28} />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-xl font-bold text-cafe-text leading-tight">{log.cafeName}</h3>
              {log.cafeUrl && (
                <a
                  href={log.cafeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-xs font-semibold text-cafe-primary hover:underline"
                >
                  <span className="truncate">お店のページを開く</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {log.origin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cafe-primary/15 text-cafe-primary">
                    国: {log.origin}
                  </span>
                )}
                {log.region && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/15 text-amber-900">
                    地域: {log.region}
                  </span>
                )}
                {log.farm && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800">
                    農園: {log.farm}
                  </span>
                )}
                {log.variety && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-800">
                    品種: {log.variety}
                  </span>
                )}
                {log.process && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800">
                    精製: {log.process}
                  </span>
                )}
                {log.roast && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-800">
                    焙煎: {log.roast}
                  </span>
                )}
                {log.isBlend !== null && log.isBlend !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-800">
                    {log.isBlend ? "ブレンド" : "シングル"}
                  </span>
                )}
                {log.servingStyle && (
                  <span className="bg-cafe-primary/5 text-cafe-primary text-xs font-bold px-3 py-1.5 rounded-full border border-cafe-primary/10">
                    {log.servingStyle === "hot" ? "ホット" : "アイス"}
                  </span>
                )}
                {!log.origin &&
                  !log.region &&
                  !log.farm &&
                  !log.variety &&
                  !log.process &&
                  !log.roast &&
                  log.isBlend == null &&
                  !log.servingStyle && (
                    <span className="text-xs text-cafe-secondary italic">豆の詳細情報なし</span>
                  )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-cafe-secondary/10 py-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider block">
                評価
              </span>
              <div className="flex items-center space-x-2">
                {renderStars(log.rating)}
                {log.rating && (
                  <div className="inline-flex items-baseline text-cafe-secondary">
                    <span className="text-xl font-extrabold text-cafe-primary leading-none">
                      {log.rating}
                    </span>
                    <span className="text-xs font-semibold text-cafe-secondary/50 mx-0.5">/</span>
                    <span className="text-xs font-semibold text-cafe-secondary">5</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider block">
                金額
              </span>
              <span className="text-sm font-bold text-cafe-text">
                {log.price !== null && log.price !== undefined
                  ? `¥${log.price.toLocaleString()}`
                  : "未登録"}
              </span>
            </div>

            <div className="space-y-1 col-span-2 pt-2">
              <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider block flex items-center space-x-1">
                <Calendar size={10} />
                <span>訪問日</span>
              </span>
              <span className="text-sm font-semibold text-cafe-text">
                {formatDate(log.visitDate)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider block flex items-center space-x-1">
              <MessageSquare size={10} />
              <span>メモ / 味の感想</span>
            </span>
            {log.note ? (
              <p className="text-sm text-cafe-text leading-relaxed whitespace-pre-wrap bg-cafe-background/40 p-4 rounded-xl border border-cafe-secondary/10 font-medium">
                {log.note}
              </p>
            ) : (
              <p className="text-xs text-cafe-secondary italic">メモは登録されていません。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogDetailPage;
