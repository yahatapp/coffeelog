import {
  Button,
  Loading,
  ErrorState,
  EmptyState,
  StoreLink,
  formatDisplayDate,
  FormNotice,
  notify,
  PageHeading,
  PageStatus,
  useAppBack,
  usePreviousAppPath,
} from "@yahatapp/ui";
import { getCountryCode } from "@yahatapp/coffee-reference";
import styles from "./log-detail.module.css";
import { cafeMutationError, mutationNotices } from "@/lib/mutationNotices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Edit2,
  MessageSquare,
  MapPin,
  Star,
  Trash2,
} from "lucide-react";
import { CafeLogForm } from "@/components/CafeLogForm";
import { CoffeeAttributes } from "@/components/CoffeeAttributes";
import { LogImages } from "@/components/LogImages";
import { OriginFlag } from "@/components/OriginFlag";
import type { CafeLogFormValues } from "@/lib/cafeLogForm";
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
  isBlend: log.isBlend ?? null,
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
        <Star className={styles.starEmpty} />
        {rating > index && (
          <span className={styles.starFill} data-half={rating < index + 1 || undefined}>
            <Star />
          </span>
        )}
      </span>
    ))}
  </span>
);

const LogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useAppBack("/logs");
  const saved = useRef(false);
  const location = useLocation();
  const previousPath = usePreviousAppPath();
  const routeState = location.state as { photoWarning?: string | null } | null;
  const warning = routeState?.photoWarning;
  const queryClient = useQueryClient();
  const logQuery = useQuery(cafelogQueries.log(id ?? ""));
  const log = logQuery.data ?? null;
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateMutation = useMutation({
    mutationFn: saveLogWithImages,
  });
  const deleteMutation = useMutation({ mutationFn: deleteLog, meta: mutationNotices.deleteLog });
  const defaultValues = useMemo(() => (log ? toFormValues(log) : null), [log]);
  const queryError = logQuery.isError ? "最新の記録を取得できませんでした。" : null;
  const isSubmitting = isSaving || deleteMutation.isPending;

  const handleSave = async (values: CafeLogFormValues) => {
    if (!id || isSaving) return;
    setIsSaving(true);
    try {
      const { data: updatedLog, notice } = await updateMutation.mutateAsync({ id, values });
      analytics.trackEvent("record_update_success");
      queryClient.setQueryData(cafelogQueries.log(id).queryKey, (current) =>
        current ? { ...current, ...updatedLog } : updatedLog,
      );
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.all });
      saved.current = true;
      if (warning || notice) {
        const { pathname, search, hash } = location;
        void navigate(
          { pathname, search, hash },
          {
            replace: true,
            state: { ...routeState, photoWarning: notice?.message ?? null },
          },
        );
      }
      if (!notice) notify({ variant: "success", message: "記録を更新しました。" });
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
      if (previousPath === "/logs") void navigate(-1);
      else void navigate("/logs", { replace: true });
    } catch (error: unknown) {
      console.error("Error deleting log", error);
    }
  };

  const editButton = useRef<HTMLButtonElement>(null),
    deleteButton = useRef<HTMLButtonElement>(null),
    confirmation = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!isEditMode) return;
    const detailTitle = document.title;
    const editTitle = "記録の編集 | Cafelog";
    document.title = editTitle;
    return () => {
      if (document.title === editTitle) document.title = detailTitle;
    };
  }, [isEditMode]);

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
  if (id && logQuery.isPending)
    return (
      <PageStatus>
        <Loading label="記録を読み込み中..." />
      </PageStatus>
    );
  if (logQuery.isError && !log)
    return (
      <PageStatus>
        <ErrorState
          message="記録を取得できませんでした。"
          onRetry={() => void logQuery.refetch()}
        />
      </PageStatus>
    );
  if (!log)
    return (
      <PageStatus>
        <EmptyState
          title="データが見つかりませんでした。"
          action={
            <Button asChild>
              <Link to="/logs">一覧へ戻る</Link>
            </Button>
          }
        />
      </PageStatus>
    );
  const origin = log.origin?.trim();
  const coffeeTitle = [origin, log.variety?.trim(), log.process?.trim()].filter(Boolean).join(" ");

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="記録一覧に戻る"
            disabled={isSubmitting}
            onClick={goBack}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </Button>
          <PageHeading className={styles.heading}>
            {isEditMode ? "記録の編集" : "記録の詳細"}
          </PageHeading>
        </div>
        {!isEditMode && !showDeleteConfirm && (
          <div className={styles.actions}>
            <Button
              ref={editButton}
              type="button"
              variant="ghost"
              size="icon"
              aria-label="編集"
              onClick={() => {
                saved.current = false;
                updateMutation.reset();
                setIsEditMode(true);
              }}
            >
              <Edit2 size={18} aria-hidden="true" />
            </Button>
            <Button
              ref={deleteButton}
              type="button"
              variant="ghost"
              size="icon"
              aria-label="削除"
              onClick={() => {
                deleteMutation.reset();
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={18} aria-hidden="true" />
            </Button>
          </div>
        )}
      </header>
      {!isEditMode && queryError && <FormNotice message={queryError} />}
      {warning && <FormNotice message={warning} warning />}
      {showDeleteConfirm && (
        <section aria-labelledby="delete-confirmation-title" className={styles.confirmation}>
          <h2
            ref={confirmation}
            id="delete-confirmation-title"
            tabIndex={-1}
            className={styles.confirmationTitle}
          >
            記録を削除しますか？
          </h2>
          <p>この操作は取り消せません。「{log.cafeName}」の記録を削除しますか？</p>
          {deleteMutation.error && (
            <FormNotice message={cafeMutationError(deleteMutation.error, "削除")} />
          )}
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
          saved={saved}
          onSubmit={handleSave}
          error={
            updateMutation.error ? cafeMutationError(updateMutation.error, "更新") : queryError
          }
          submitLabel="保存する"
          isSubmitting={isSubmitting}
          onCancel={() => setIsEditMode(false)}
          maxImages={Math.max(0, 5 - imageCount)}
        />
      ) : (
        <article className={styles.panel}>
          <section aria-label="お店の情報" className={styles.storeSection}>
            <header className={styles.storeHeading}>
              <h2 className={styles.storeTitle}>{log.cafeName}</h2>
              <div className={styles.metadata}>
                {log.prefecture && (
                  <p className={styles.prefecture}>
                    <MapPin size={14} aria-hidden="true" />
                    <span>{log.prefecture}</span>
                  </p>
                )}
                <Link className={styles.storeHistoryLink} to={`/stores/${log.storeId}`}>
                  <span>お店の記録</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </header>
            {log.links.length > 0 && (
              <ul
                aria-label="お店のリンク"
                className={styles.storeActions}
                data-columns={log.links.length >= 4 ? "4" : "3"}
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
              </ul>
            )}
          </section>
          <dl aria-label="訪問情報" className={styles.visit}>
            {log.price != null && (
              <div>
                <dt className={styles.label}>金額</dt>
                <dd>¥{log.price.toLocaleString()}</dd>
              </div>
            )}
            <div>
              <dt className={styles.label}>
                <Calendar size={14} aria-hidden="true" />
                {log.visitDate ? "訪問日" : "登録日"}
              </dt>
              <dd>{formatDisplayDate(log.visitDate ?? log.createdAt)}</dd>
            </div>
          </dl>
          {log.note && (
            <section className={styles.section}>
              <h2 className={styles.label}>
                <MessageSquare size={14} aria-hidden="true" />
                メモ / 味の感想
              </h2>
              <p className={styles.note}>{log.note}</p>
            </section>
          )}
          {id && <LogImages logId={id} onCountChange={setImageCount} collapsible />}
          <section aria-label="飲んだコーヒーの概要" className={styles.coffeeSummary}>
            <h2 className={styles.summaryHeading}>
              {getCountryCode(origin) && (
                <span aria-hidden="true">
                  <OriginFlag origin={origin} />
                </span>
              )}
              <span>{coffeeTitle || "飲んだコーヒー"}</span>
            </h2>
            {(log.servingStyle || log.isBlend != null) && (
              <ul aria-label="一杯のスタイル" className={styles.optionGroup}>
                {log.servingStyle && (
                  <li className={styles.summaryOption}>
                    {log.servingStyle === "iced" ? "アイス" : "ホット"}
                  </li>
                )}
                {log.isBlend != null && (
                  <li className={styles.summaryOption}>{log.isBlend ? "ブレンド" : "シングル"}</li>
                )}
              </ul>
            )}
            {log.rating != null && (
              <div className={styles.rating} role="img" aria-label={`評価 ${log.rating} / 5`}>
                {renderStars(log.rating)}
                <span>{log.rating.toFixed(1)}</span>
              </div>
            )}
          </section>
          <CoffeeAttributes coffee={log} />
        </article>
      )}
      {id && isEditMode && <LogImages logId={id} onCountChange={setImageCount} />}
    </div>
  );
};
export default LogDetailPage;
