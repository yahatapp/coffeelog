import { Button, Loading, ErrorState, EmptyState, StoreLink } from "@yahatapp/ui";
import styles from "./log-detail.module.css";
import { mutationNotices } from "@/lib/mutationNotices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Coffee,
  Edit2,
  MessageSquare,
  MapPin,
  Snowflake,
  Star,
  ThermometerSun,
  Trash2,
} from "lucide-react";
import { CafeLogForm } from "@/components/CafeLogForm";
import { FloatingNotice } from "@/components/FloatingNotice";
import { CoffeeAttributes } from "@/components/CoffeeAttributes";
import { LogImages } from "@/components/LogImages";
import { OriginFlag } from "@/components/OriginFlag";
import type { CafeLogFormValues } from "@/lib/cafeLogForm";
import { getErrorMessage } from "@/lib/errors";
import { analytics } from "@/lib/analytics";
import { cafelogQueries, deleteLog, type LogResponse } from "@/lib/queries";
import { saveLogWithImages } from "@/lib/saveLog";

const toFormValues = (log: LogResponse): CafeLogFormValues => ({
  cafeName: log.cafeName,
  cafeLinks: log.links.length > 0 ? log.links.map((link) => link.url) : [""],
  prefecture: log.prefecture ?? "",
  origin: log.origin ?? "",
  region: log.region ?? "",
  variety: log.variety ?? "",
  farm: log.farm ?? "",
  producer: log.producer ?? "",
  process: log.process ?? "",
  roast: log.roast ?? "",
  isBlend: log.isBlend ?? false,
  servingStyle: log.servingStyle === "hot" || log.servingStyle === "iced" ? log.servingStyle : null,
  flavorNotes: log.flavorNotes.length > 0 ? log.flavorNotes : [""],
  rating: log.rating,
  price: log.price == null ? "" : String(log.price),
  visitDate: log.visitDate ?? "",
  note: log.note ?? "",
  images: [],
});

const renderStars = (rating: number) => (
  <span className={styles.stars} aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={styles.star}>
        <Star size={16} className={styles.starEmpty} />
        {rating > index && (
          <span className={styles.starFill} data-half={rating < index + 1 || undefined}>
            <Star size={16} />
          </span>
        )}
      </span>
    ))}
  </span>
);

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
  const queryClient = useQueryClient();
  const logQuery = useQuery(cafelogQueries.log(id ?? ""));
  const log = logQuery.data ?? null;
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateMutation = useMutation({
    mutationFn: saveLogWithImages,
    meta: mutationNotices.updateLog,
  });
  const deleteMutation = useMutation({ mutationFn: deleteLog, meta: mutationNotices.deleteLog });
  const defaultValues = useMemo(() => (log ? toFormValues(log) : null), [log]);
  const queryError = logQuery.error
    ? getErrorMessage(logQuery.error, "通信エラーが発生しました。")
    : null;
  const isSubmitting = isSaving || deleteMutation.isPending;

  const handleSave = async (values: CafeLogFormValues) => {
    if (!id || isSaving) return;
    setIsSaving(true);
    try {
      const { data: updatedLog } = await updateMutation.mutateAsync({ id, values });
      analytics.trackEvent("record_update_success");
      queryClient.setQueryData(cafelogQueries.log(id).queryKey, (current) =>
        current ? { ...current, ...updatedLog } : updatedLog,
      );
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.all });
      setIsEditMode(false);
    } catch (error: unknown) {
      analytics.trackEvent("record_update_error");
      console.error("Error updating log", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      queryClient.removeQueries({ queryKey: cafelogQueries.log(id).queryKey });
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.all });
      void navigate("/logs");
    } catch (error: unknown) {
      console.error("Error deleting log", error);
      setShowDeleteConfirm(false);
    }
  };

  const editButton = useRef<HTMLButtonElement>(null),
    deleteButton = useRef<HTMLButtonElement>(null),
    confirmation = useRef<HTMLHeadingElement>(null);
  const wasEditing = useRef(false),
    wasConfirming = useRef(false);
  useEffect(() => {
    if (isEditMode) document.getElementById("cafe-name")?.focus();
    else if (wasEditing.current) editButton.current?.focus();
    wasEditing.current = isEditMode;
  }, [isEditMode]);
  useEffect(() => {
    if (showDeleteConfirm) confirmation.current?.focus();
    else if (wasConfirming.current) deleteButton.current?.focus();
    wasConfirming.current = showDeleteConfirm;
  }, [showDeleteConfirm]);
  if (id && logQuery.isPending) return <Loading label="記録を読み込み中..." />;
  if (logQuery.isError && !log)
    return (
      <ErrorState message="記録を取得できませんでした。" onRetry={() => void logQuery.refetch()} />
    );
  if (!log)
    return (
      <EmptyState
        title="データが見つかりませんでした。"
        action={
          <Button asChild>
            <Link to="/logs">一覧へ戻る</Link>
          </Button>
        }
      />
    );
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Button asChild variant="ghost" size="icon">
            <Link to="/logs" aria-label="記録一覧に戻る">
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
          </Button>
          <h2 className={styles.heading}>{isEditMode ? "記録の編集" : "記録の詳細"}</h2>
        </div>
        {!isEditMode && !showDeleteConfirm && (
          <div className={styles.actions}>
            <Button
              ref={editButton}
              type="button"
              variant="ghost"
              size="icon"
              aria-label="編集"
              onClick={() => setIsEditMode(true)}
            >
              <Edit2 size={18} aria-hidden="true" />
            </Button>
            <Button
              ref={deleteButton}
              type="button"
              variant="ghost"
              size="icon"
              aria-label="削除"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={18} aria-hidden="true" />
            </Button>
          </div>
        )}
      </header>
      {!isEditMode && queryError && (
        <FloatingNotice
          key={queryError}
          message="最新の記録を取得できませんでした。画面を開き直してお試しください。"
        />
      )}
      {showDeleteConfirm && (
        <section aria-labelledby="delete-confirmation-title" className={styles.confirmation}>
          <h3
            ref={confirmation}
            id="delete-confirmation-title"
            tabIndex={-1}
            className={styles.confirmationTitle}
          >
            記録を削除しますか？
          </h3>
          <p>この操作は取り消せません。「{log.cafeName}」の記録を削除しますか？</p>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {deleteMutation.isPending ? "削除中..." : "削除する"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setShowDeleteConfirm(false)}
            >
              キャンセル
            </Button>
          </div>
        </section>
      )}
      {isEditMode && defaultValues ? (
        <CafeLogForm
          defaultValues={defaultValues}
          onSubmit={handleSave}
          error={queryError ? "最新の記録を取得できませんでした。" : null}
          submitLabel="保存する"
          isSubmitting={isSubmitting}
          onCancel={() => setIsEditMode(false)}
          maxImages={Math.max(0, 5 - imageCount)}
        />
      ) : (
        <article className={styles.panel}>
          <section aria-label="お店の情報" className={styles.storeSection}>
            <header className={styles.storeHeading}>
              <h3 className={styles.storeTitle}>{log.cafeName}</h3>
              <p className={styles.metadata}>
                <MapPin size={14} aria-hidden="true" />
                {log.prefecture || "都道府県未登録"}
              </p>
            </header>
            <ul
              aria-label="お店のリンク"
              className={styles.storeActions}
              data-columns={log.links.length + 1 >= 4 ? "4" : "3"}
            >
              {log.links.map((link) => (
                <li key={link.id} className={styles.storeAction}>
                  <StoreLink
                    href={link.url}
                    appearance="icon"
                    onClick={() => analytics.trackEvent("external_link_click")}
                  />
                </li>
              ))}
              <li className={styles.storeAction}>
                <Button asChild variant="secondary" size="icon-lg">
                  <Link
                    to={`/stores/${log.storeId}`}
                    aria-label="このお店のコーヒー記録"
                    title="このお店のコーヒー記録"
                  >
                    <Coffee size={24} aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            </ul>
          </section>
          <section aria-label="飲んだコーヒーの概要" className={styles.coffeeSummary}>
            <h3 className={styles.summaryHeading}>飲んだコーヒー</h3>
            <dl className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <dt className={styles.label}>国</dt>
                <dd className={styles.summaryValue}>
                  <OriginFlag origin={log.origin} />
                  {log.origin || "産地未登録"}
                </dd>
              </div>
              <div className={styles.summaryItem}>
                <dt className={styles.label}>提供方法</dt>
                <dd className={styles.summaryValue}>
                  {log.servingStyle === "hot" || log.servingStyle === "iced" ? (
                    <span className={styles.temperature} data-temperature={log.servingStyle}>
                      {log.servingStyle === "iced" ? (
                        <Snowflake size={15} aria-hidden="true" />
                      ) : (
                        <ThermometerSun size={15} aria-hidden="true" />
                      )}
                      {log.servingStyle === "iced" ? "アイス" : "ホット"}
                    </span>
                  ) : (
                    <span className={styles.muted}>未登録</span>
                  )}
                </dd>
              </div>
              <div className={styles.summaryItem}>
                <dt className={styles.label}>豆の種類</dt>
                <dd className={styles.summaryValue}>
                  {log.isBlend == null ? "未登録" : log.isBlend ? "ブレンド" : "シングル"}
                </dd>
              </div>
              <div className={styles.summaryItem}>
                <dt className={styles.label}>評価</dt>
                <dd className={styles.summaryValue}>
                  {log.rating == null ? (
                    <span className={styles.muted}>評価なし</span>
                  ) : (
                    <span
                      className={styles.rating}
                      role="img"
                      aria-label={`評価 ${log.rating} / 5`}
                    >
                      {renderStars(log.rating)}
                      <span>{log.rating}</span>
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </section>
          <CoffeeAttributes coffee={log} />
          <section className={styles.section}>
            <h4 className={styles.label}>
              <MessageSquare size={14} aria-hidden="true" />
              メモ / 味の感想
            </h4>
            {log.note ? (
              <p className={styles.note}>{log.note}</p>
            ) : (
              <p className={styles.muted}>メモは登録されていません。</p>
            )}
          </section>
          <dl aria-label="訪問情報" className={styles.visit}>
            <div>
              <dt className={styles.label}>金額</dt>
              <dd>{log.price == null ? "未登録" : `¥${log.price.toLocaleString()}`}</dd>
            </div>
            <div>
              <dt className={styles.label}>
                <Calendar size={14} aria-hidden="true" />
                訪問日
              </dt>
              <dd>{formatDate(log.visitDate)}</dd>
            </div>
          </dl>
        </article>
      )}
      {id && <LogImages logId={id} onCountChange={setImageCount} collapsible={!isEditMode} />}
    </div>
  );
};
export default LogDetailPage;
