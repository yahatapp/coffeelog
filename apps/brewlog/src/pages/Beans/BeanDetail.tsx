import {
  Loading,
  ErrorState,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@yahatapp/ui";
import styles from "./bean-detail.module.css";
import type { MutationNoticeResult } from "@yahatapp/ui";
import { mutationNotices } from "@/lib/mutationNotices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Coffee, CopyPlus, Edit2, Archive, ChevronRight, Trash2 } from "lucide-react";
import { beanQueries, mutations, queryKeys } from "@/lib/queries";
import { OriginFlag } from "@/components/ui/OriginFlag";
import { RoastLevelIndicator } from "@/components/ui/RoastLevelIndicator";
import { BeanVersionHistory } from "@/components/BeanVersionHistory";
import { getBeanVersionLabel } from "@/lib/bean-versions";
const formatDate = (date: string | null) => date?.replaceAll("-", ".") || "未設定";
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={styles.detailRow}>
    <dt>{label}</dt>
    <dd>{value || "未設定"}</dd>
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
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.titleRow}>
          <Button asChild variant="ghost" size="icon" aria-label="豆一覧へ戻る">
            <Link to="/beans">
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
          </Button>
          <h2 className={styles.pageTitle}>豆の詳細</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={bean.isArchived}
          onClick={() => navigate(`/beans/${bean.id}/edit`)}
          type="button"
        >
          <Edit2 size={14} aria-hidden="true" /> 編集
        </Button>
      </div>

      {bean.isArchived && (
        <p className={styles.archiveNotice}>
          この豆はアーカイブ済みのため、編集・抽出記録はできません。再購入したらバージョンを追加できます。
        </p>
      )}

      <Card>
        <CardContent>
          <div className={styles.overview}>
            <div className={styles.metadata}>
              <span className={styles.coffeeType}>
                {bean.coffeeType === "specialty" ? "スペシャルティコーヒー" : "レギュラーコーヒー"}
              </span>
              {bean.roastLevel != null && <RoastLevelIndicator level={bean.roastLevel} />}
            </div>
            <h3 className={styles.beanName}>{bean.name}</h3>
            {bean.origin && (
              <div className={styles.origin}>
                <OriginFlag origin={bean.origin} size="sm" />
                <span>{bean.origin}</span>
              </div>
            )}
            <p className={styles.version}>バージョン: {getBeanVersionLabel(bean)}</p>
            <div className={styles.primaryActions}>
              <Button
                disabled={bean.isArchived}
                onClick={() => navigate(`/logs/new?beanId=${bean.id}`)}
                fullWidth
                type="button"
              >
                <Coffee size={18} aria-hidden="true" /> 淹れる
              </Button>
              <Button asChild variant="outline" fullWidth>
                <Link to={`/beans/new?parentBeanId=${bean.parentBeanId ?? bean.id}`}>
                  <CopyPlus size={16} aria-hidden="true" /> バージョン追加
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>購入・焙煎情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className={styles.details}>
            <DetailRow
              label="購入店"
              value={
                bean.storeId ? (
                  <Link to={`/stores/${bean.storeId}`} className={styles.storeLink}>
                    <span>{bean.purchaseStore || "店舗の記録を見る"}</span>
                    <ChevronRight size={16} aria-hidden="true" />
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
        </CardContent>
      </Card>

      {bean.coffeeType === "specialty" &&
        (bean.region || bean.variety || bean.farm || bean.producer) && (
          <Card>
            <CardHeader>
              <CardTitle>生産情報</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className={styles.details}>
                <DetailRow label="地域" value={bean.region} />
                <DetailRow label="品種" value={bean.variety} />
                <DetailRow label="農園" value={bean.farm} />
                <DetailRow label="生産者" value={bean.producer} />
              </dl>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle>メモ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={styles.note}>{bean.note || "メモはありません。"}</p>
        </CardContent>
      </Card>

      <BeanVersionHistory bean={bean} />

      <div className={styles.secondaryActions}>
        <Button
          variant="ghost"
          loading={archiveMutation.isPending}
          disabled={deleteMutation.isPending}
          onClick={() =>
            archiveMutation.mutate({
              beanId: bean.id,
              isArchived: !bean.isArchived,
            })
          }
          type="button"
        >
          <Archive size={16} aria-hidden="true" />
          {bean.isArchived ? "アーカイブから戻す" : "アーカイブする"}
        </Button>
        <Button
          loading={deleteMutation.isPending}
          disabled={archiveMutation.isPending}
          onClick={() => {
            if (window.confirm("この豆を削除しますか？抽出記録は削除されません。")) {
              deleteMutation.mutate(bean.id);
            }
          }}
          variant="danger"
          type="button"
        >
          <Trash2 size={16} aria-hidden="true" /> 削除する
        </Button>
      </div>
      {(archiveMutation.isError || deleteMutation.isError) && (
        <p className={styles.operationError} role="alert">
          操作に失敗しました。もう一度お試しください。
        </p>
      )}
    </div>
  );
};
export default BeanDetail;
