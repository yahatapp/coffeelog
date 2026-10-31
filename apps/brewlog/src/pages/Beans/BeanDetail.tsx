import { Loading, ErrorState } from "@yahatapp/ui";
import styles from "../content.module.css";
import type { MutationNoticeResult } from "@yahatapp/ui";
import { mutationNotices } from "@/lib/mutationNotices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Coffee,
  CopyPlus,
  Edit2,
  Archive,
  MapPin,
  NotebookText,
  Store,
  Trash2,
} from "lucide-react";
import { beanQueries, mutations, queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OriginFlag } from "@/components/ui/OriginFlag";
import { RoastLevelIndicator } from "@/components/ui/RoastLevelIndicator";
import { BeanVersionHistory } from "@/components/BeanVersionHistory";
import { getBeanVersionLabel } from "@/lib/bean-versions";
const formatDate = (date: string | null) => date?.replaceAll("-", ".") || "未設定";
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={[styles.border, styles.row, styles.spread, styles.start].join(" ")}>
    <dt className={[styles.fixed, styles.body, styles.muted].join(" ")}>{label}</dt>
    <dd className={[styles.end, styles.body, styles.strong, styles.foreground].join(" ")}>
      {value || "未設定"}
    </dd>
  </div>
);
const BeanDetail = () => {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const beanQuery = useQuery(beanQueries.detail(id ?? ""));
  const archiveMutation = useMutation({
    meta: mutationNotices.setBeanArchived,
    mutationFn: async ({ beanId, isArchived }: { beanId: string; isArchived: boolean }) => {
      const bean = await mutations.setBeanArchived({
        id: beanId,
        isArchived,
      });
      return {
        data: bean,
        notice: {
          variant: "success",
          message: isArchived ? "豆をアーカイブしました。" : "豆をアーカイブから戻しました。",
        },
      } satisfies MutationNoticeResult<typeof bean>;
    },
    onSuccess: async ({ data: bean }) => {
      queryClient.setQueryData(queryKeys.bean(bean.id), bean);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.beans,
      });
    },
  });
  const deleteMutation = useMutation({
    meta: mutationNotices.deleteBean,
    mutationFn: mutations.deleteBean,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.beans,
      });
      void navigate("/beans");
    },
  });
  if (beanQuery.isPending) {
    return <Loading />;
  }
  if (beanQuery.isError || !beanQuery.data) {
    return (
      <ErrorState
        message="豆の詳細を取得できませんでした。"
        onRetry={() => void beanQuery.refetch()}
      />
    );
  }
  const bean = beanQuery.data;
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/beans")}
          type="button"
          aria-label="戻る"
        >
          <ArrowLeft size={20} />
          <span className={styles.visuallyHidden}>豆一覧へ戻る</span>
        </Button>
        <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>豆の詳細</h2>
      </div>

      <div className={styles.tiles}>
        <Button
          variant="outline"
          onClick={() => navigate(`/beans/new?parentBeanId=${bean.parentBeanId ?? bean.id}`)}
          type="button"
        >
          <CopyPlus size={16} /> バージョン追加
        </Button>
        <Button
          variant="outline"
          disabled={bean.isArchived}
          onClick={() => navigate(`/beans/${bean.id}/edit`)}
          type="button"
        >
          <Edit2 size={16} /> 編集
        </Button>
      </div>

      {bean.isArchived && (
        <p
          className={[styles.tonal, styles.rounded, styles.content, styles.body, styles.muted].join(
            " ",
          )}
        >
          この豆はアーカイブ済みのため、編集・抽出記録はできません。再購入したらバージョンを追加できます。
        </p>
      )}

      <Card>
        <div className={[styles.tonal, styles.content].join(" ")}>
          <div className={[styles.row, styles.spread, styles.start].join(" ")}>
            <div className={styles.grow}>
              <p className={[styles.helper, styles.strong, styles.muted].join(" ")}>
                {bean.coffeeType === "specialty" ? "スペシャルティコーヒー" : "レギュラーコーヒー"}
              </p>
              <h3
                className={[
                  styles.hero,
                  styles.strong,
                  styles.accent,
                  styles.wrap,
                  styles.separated,
                ].join(" ")}
              >
                {bean.name}
              </h3>
              <p className={[styles.body, styles.muted, styles.separated].join(" ")}>
                バージョン: {getBeanVersionLabel(bean)}
              </p>
            </div>
            {bean.roastLevel && <RoastLevelIndicator level={bean.roastLevel} />}
          </div>
          {bean.origin && (
            <div className={[styles.row, styles.body, styles.muted, styles.separated].join(" ")}>
              <OriginFlag origin={bean.origin} size="md" />
              <MapPin size={14} aria-hidden="true" />
              <span>{bean.origin}</span>
            </div>
          )}
        </div>

        <div className={[styles.content, styles.stack].join(" ")}>
          <section aria-labelledby="bean-purchase-heading">
            <h4
              id="bean-purchase-heading"
              className={[styles.row, styles.body, styles.strong, styles.accent].join(" ")}
            >
              <Store size={16} aria-hidden="true" /> 購入・焙煎情報
            </h4>
            <dl className={styles.separated}>
              <DetailRow
                label="購入店"
                value={
                  bean.storeId ? (
                    <Link
                      to={`/stores/${bean.storeId}`}
                      className={[styles.row, styles.target, styles.accent, styles.textLink].join(
                        " ",
                      )}
                    >
                      {bean.purchaseStore || "店舗の記録を見る"}
                    </Link>
                  ) : (
                    bean.purchaseStore
                  )
                }
              />
              <DetailRow label="購入日" value={formatDate(bean.purchaseDate)} />
              <DetailRow label="焙煎日" value={formatDate(bean.roastDate)} />
              <DetailRow label="精製方法" value={bean.processMethod} />
            </dl>
          </section>

          {bean.coffeeType === "specialty" &&
            (bean.region || bean.variety || bean.farm || bean.producer) && (
              <section
                className={[styles.border, styles.separated].join(" ")}
                aria-labelledby="bean-production-heading"
              >
                <h4
                  id="bean-production-heading"
                  className={[styles.body, styles.strong, styles.accent].join(" ")}
                >
                  生産情報
                </h4>
                <dl className={styles.separated}>
                  <DetailRow label="地域" value={bean.region} />
                  <DetailRow label="品種" value={bean.variety} />
                  <DetailRow label="農園" value={bean.farm} />
                  <DetailRow label="生産者" value={bean.producer} />
                </dl>
              </section>
            )}

          <section
            className={[styles.border, styles.separated].join(" ")}
            aria-labelledby="bean-note-heading"
          >
            <h4
              id="bean-note-heading"
              className={[styles.row, styles.body, styles.strong, styles.accent].join(" ")}
            >
              <NotebookText size={16} aria-hidden="true" /> メモ
            </h4>
            <p
              className={[
                styles.tonal,
                styles.rounded,
                styles.content,
                styles.body,
                styles.foreground,
                styles.multiline,
                styles.separated,
              ].join(" ")}
            >
              {bean.note || "メモはありません。"}
            </p>
          </section>
        </div>
      </Card>

      <BeanVersionHistory bean={bean} />

      <div className={styles.fieldStack}>
        <Button
          disabled={bean.isArchived}
          onClick={() => navigate(`/logs/new?beanId=${bean.id}`)}
          fullWidth
          type="button"
        >
          <Coffee size={18} /> 淹れる
        </Button>
        <div className={styles.stack}>
          <Button
            variant="ghost"
            disabled={archiveMutation.isPending || deleteMutation.isPending}
            onClick={() =>
              archiveMutation.mutate({
                beanId: bean.id,
                isArchived: !bean.isArchived,
              })
            }
            type="button"
          >
            <Archive size={16} />
            {bean.isArchived ? "アーカイブから戻す" : "アーカイブする"}
          </Button>
          <Button
            disabled={archiveMutation.isPending || deleteMutation.isPending}
            onClick={() => {
              if (window.confirm("この豆を削除しますか？抽出記録は削除されません。")) {
                deleteMutation.mutate(bean.id);
              }
            }}
            variant="danger"
            type="button"
          >
            <Trash2 size={16} /> 削除する
          </Button>
        </div>
        {(archiveMutation.isError || deleteMutation.isError) && (
          <p className={[styles.center, styles.body, styles.dangerText].join(" ")}>
            操作に失敗しました。もう一度お試しください。
          </p>
        )}
      </div>
    </div>
  );
};
export default BeanDetail;
