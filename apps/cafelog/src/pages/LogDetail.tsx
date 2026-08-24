import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Coffee,
  Edit2,
  ExternalLink,
  Loader2,
  MessageSquare,
  Star,
  Trash2,
} from "lucide-react";
import { CafeLogForm } from "@/components/CafeLogForm";
import { LogImages } from "@/components/LogImages";
import type { CafeLogFormValues } from "@/lib/cafeLogForm";
import { getErrorMessage } from "@/lib/errors";
import {
  cafelogQueries,
  deleteLog,
  type LogResponse,
  updateLog,
  uploadLogImages,
} from "@/lib/queries";

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
  const parts = [log.origin, log.region, log.farm, log.variety].filter(Boolean);
  const tags = [
    log.process,
    log.roast,
    log.isBlend == null ? null : log.isBlend ? "ブレンド" : "シングル",
    log.servingStyle === "hot" ? "ホット" : log.servingStyle === "iced" ? "アイス" : null,
  ].filter(Boolean);
  const base = parts.join(" ");
  return tags.length ? `${base} (${tags.join(" / ")})`.trim() : base || "豆の詳細情報なし";
};

const toFormValues = (log: LogResponse): CafeLogFormValues => ({
  cafeName: log.cafeName,
  cafeUrl: log.cafeUrl ?? "",
  origin: log.origin ?? "",
  region: log.region ?? "",
  variety: log.variety ?? "",
  farm: log.farm ?? "",
  process: log.process ?? "",
  roast: log.roast ?? "",
  isBlend: log.isBlend ?? false,
  servingStyle: log.servingStyle === "hot" || log.servingStyle === "iced" ? log.servingStyle : null,
  rating: log.rating,
  price: log.price == null ? "" : String(log.price),
  visitDate: log.visitDate ?? "",
  note: log.note ?? "",
  images: [],
});

const renderStars = (rating: number | null | undefined) => {
  if (rating == null) return <span className="text-xs text-cafe-secondary/40">評価なし</span>;
  return (
    <div className="flex items-center space-x-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={16}
          className={
            index + 1 <= rating ? "fill-cafe-accent text-cafe-accent" : "text-cafe-secondary/20"
          }
        />
      ))}
    </div>
  );
};

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "未設定";

const LogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as { edit?: boolean; photoUploadError?: string } | null;
  const queryClient = useQueryClient();
  const logQuery = useQuery(cafelogQueries.log(id ?? ""));
  const log = logQuery.data ?? null;
  const [isEditMode, setIsEditMode] = useState(navigationState?.edit ?? false);
  const [imageCount, setImageCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(
    navigationState?.photoUploadError ?? null,
  );
  const updateMutation = useMutation({ mutationFn: updateLog });
  const deleteMutation = useMutation({ mutationFn: deleteLog });
  const defaultValues = useMemo(() => (log ? toFormValues(log) : null), [log]);
  const queryError = logQuery.error
    ? getErrorMessage(logQuery.error, "通信エラーが発生しました。")
    : null;
  const isSubmitting = updateMutation.isPending || deleteMutation.isPending;

  const handleSave = async (values: CafeLogFormValues) => {
    if (!id) return;
    setActionError(null);
    try {
      const updatedLog = await updateMutation.mutateAsync({ id, values });
      queryClient.setQueryData(cafelogQueries.log(id).queryKey, (current) =>
        current ? { ...current, ...updatedLog } : updatedLog,
      );
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.logs().queryKey });
      try {
        await uploadLogImages(id, values.images);
        await queryClient.invalidateQueries({ queryKey: cafelogQueries.images(id).queryKey });
        setPhotoUploadError(null);
        setIsEditMode(false);
      } catch (uploadError: unknown) {
        console.error("Error uploading images", uploadError);
        setPhotoUploadError(getErrorMessage(uploadError, "写真のアップロードに失敗しました。"));
      }
    } catch (error: unknown) {
      console.error("Error updating log", error);
      setActionError(getErrorMessage(error, "通信エラーが発生しました。"));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(id);
      queryClient.removeQueries({ queryKey: cafelogQueries.log(id).queryKey });
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.logs().queryKey });
      void navigate("/logs");
    } catch (error: unknown) {
      console.error("Error deleting log", error);
      setActionError(getErrorMessage(error, "通信エラーが発生しました。"));
      setShowDeleteConfirm(false);
    }
  };

  if (id && logQuery.isPending) {
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
            {queryError || "データが見つかりませんでした。"}
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
              type="button"
              onClick={() => setIsEditMode(true)}
              className="p-2 text-cafe-secondary hover:text-cafe-primary hover:bg-cafe-primary/5 rounded-xl active:scale-95 transition-all"
              title="編集"
            >
              <Edit2 size={18} />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl active:scale-95 transition-all"
              title="削除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {(queryError || actionError) && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-xl font-semibold">
          {queryError || actionError}
        </div>
      )}
      {photoUploadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-4 rounded-xl font-semibold">
          記録は保存済みです。{photoUploadError} 写真を選び直して保存してください。
        </div>
      )}

      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h4 className="text-red-700 font-bold text-sm">記録を削除しますか？</h4>
            <p className="text-xs text-red-600 leading-relaxed">
              この操作は取り消せません。&ldquo;{log.cafeName} ({formatCoffeeInfo(log)}
              )&rdquo;の記録を本当に削除してもよろしいですか？
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "削除中..." : "削除する"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-red-50 border border-red-200 text-red-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {isEditMode && defaultValues ? (
        <CafeLogForm
          defaultValues={defaultValues}
          onSubmit={handleSave}
          error={actionError}
          submitLabel="保存する"
          isSubmitting={isSubmitting}
          onCancel={() => setIsEditMode(false)}
          maxImages={Math.max(0, 5 - imageCount)}
        />
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/15 p-6 shadow-sm space-y-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-cafe-primary/5 rounded-2xl text-cafe-primary border border-cafe-primary/10 shrink-0">
              <Coffee size={28} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="text-xl font-bold text-cafe-text leading-tight break-words">
                {log.cafeName}
              </h3>
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
              <p className="text-xs text-cafe-secondary break-words">{formatCoffeeInfo(log)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-cafe-secondary/10 py-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider block">
                評価
              </span>
              <div className="flex items-center gap-2">
                {renderStars(log.rating)}
                {log.rating != null && (
                  <span className="text-xl font-extrabold text-cafe-primary">{log.rating}</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider block">
                金額
              </span>
              <span className="text-sm font-bold text-cafe-text">
                {log.price == null ? "未登録" : `¥${log.price.toLocaleString()}`}
              </span>
            </div>
            <div className="space-y-1 col-span-2 pt-2">
              <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider flex items-center gap-1">
                <Calendar size={10} />
                訪問日
              </span>
              <span className="text-sm font-semibold text-cafe-text">
                {formatDate(log.visitDate)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-cafe-secondary uppercase tracking-wider flex items-center gap-1">
              <MessageSquare size={10} />
              メモ / 味の感想
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

      {id && <LogImages logId={id} onCountChange={setImageCount} />}
    </div>
  );
};

export default LogDetailPage;
