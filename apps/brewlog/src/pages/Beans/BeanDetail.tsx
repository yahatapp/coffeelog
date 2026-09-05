import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Coffee,
  CopyPlus,
  Edit2,
  Archive,
  Loader2,
  MapPin,
  NotebookText,
  Store,
  Trash2,
} from "lucide-react";
import { beanQueries, mutations, queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OriginFlag } from "@/components/ui/OriginFlag";
import { RoastLevelIndicator } from "@/components/ui/RoastLevelIndicator";

const formatDate = (date: string | null) => date?.replaceAll("-", ".") || "未設定";

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-coffee-secondary/10 py-3 last:border-0">
    <dt className="shrink-0 text-sm text-coffee-secondary">{label}</dt>
    <dd className="text-right text-sm font-semibold text-coffee-text">{value || "未設定"}</dd>
  </div>
);

const BeanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const beanQuery = useQuery(beanQueries.detail(id ?? ""));
  const archiveMutation = useMutation({
    mutationFn: ({ beanId, isArchived }: { beanId: string; isArchived: boolean }) =>
      mutations.updateBean({ param: { id: beanId }, json: { isArchived } }),
    onSuccess: async (bean) => {
      queryClient.setQueryData(queryKeys.bean(bean.id), bean);
      await queryClient.invalidateQueries({ queryKey: queryKeys.beans });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: mutations.deleteBean,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.beans });
      void navigate("/beans");
    },
  });

  if (beanQuery.isPending) {
    return (
      <div className="flex h-64 items-center justify-center" role="status">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
        <span className="sr-only">豆の詳細を読み込み中</span>
      </div>
    );
  }

  if (beanQuery.isError || !beanQuery.data) {
    return (
      <div className="p-8 text-center text-coffee-secondary">
        <p>豆の詳細を取得できませんでした。</p>
        <Button className="mt-4 rounded-xl" onClick={() => void beanQuery.refetch()}>
          再読み込み
        </Button>
      </div>
    );
  }

  const bean = beanQuery.data;

  return (
    <div className="animate-in space-y-5 fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/beans")}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
          <span className="sr-only">豆一覧へ戻る</span>
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">豆の詳細</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-11 rounded-2xl border-coffee-primary/30"
          disabled={bean.isArchived}
          onClick={() => navigate(`/beans/new?parentBeanId=${bean.parentBeanId ?? bean.id}`)}
        >
          <CopyPlus size={16} className="mr-2" /> バージョン追加
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-2xl border-coffee-primary/30"
          disabled={bean.isArchived}
          onClick={() => navigate(`/beans/${bean.id}/edit`)}
        >
          <Edit2 size={16} className="mr-2" /> 編集
        </Button>
      </div>

      {bean.isArchived && (
        <p className="rounded-xl bg-coffee-secondary/10 px-4 py-3 text-sm text-coffee-secondary">
          この豆はアーカイブ済みのため、編集・バージョン追加・抽出記録はできません。
        </p>
      )}

      <Card className="overflow-hidden border-2 border-coffee-primary/10 shadow-md">
        <div className="bg-coffee-primary/5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-coffee-secondary">
                {bean.coffeeType === "specialty" ? "スペシャルティコーヒー" : "レギュラーコーヒー"}
              </p>
              <h3 className="mt-1 break-words text-2xl font-bold text-coffee-primary">
                {bean.name}
              </h3>
              {bean.version && <p className="mt-1 text-sm text-coffee-secondary">{bean.version}</p>}
            </div>
            {bean.roastLevel && <RoastLevelIndicator level={bean.roastLevel} />}
          </div>
          {bean.origin && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-coffee-secondary">
              <OriginFlag origin={bean.origin} size={18} />
              <MapPin size={14} aria-hidden="true" />
              <span>{bean.origin}</span>
            </div>
          )}
        </div>

        <CardContent className="space-y-5 p-5">
          <section aria-labelledby="bean-purchase-heading">
            <h4
              id="bean-purchase-heading"
              className="flex items-center gap-2 text-sm font-bold text-coffee-primary"
            >
              <Store size={16} aria-hidden="true" /> 購入・焙煎情報
            </h4>
            <dl className="mt-2">
              <DetailRow label="購入店" value={bean.purchaseStore} />
              <DetailRow label="購入日" value={formatDate(bean.purchaseDate)} />
              <DetailRow label="焙煎日" value={formatDate(bean.roastDate)} />
              <DetailRow label="精製方法" value={bean.processMethod} />
            </dl>
          </section>

          <section
            className="border-t border-coffee-secondary/10 pt-5"
            aria-labelledby="bean-note-heading"
          >
            <h4
              id="bean-note-heading"
              className="flex items-center gap-2 text-sm font-bold text-coffee-primary"
            >
              <NotebookText size={16} aria-hidden="true" /> メモ
            </h4>
            <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-coffee-background/60 p-4 text-sm leading-6 text-coffee-text">
              {bean.note || "メモはありません。"}
            </p>
          </section>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          className="h-12 w-full rounded-2xl shadow-md"
          disabled={bean.isArchived}
          onClick={() => navigate(`/logs/new?beanId=${bean.id}`)}
        >
          <Coffee size={18} className="mr-2" /> 淹れる
        </Button>
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            disabled={archiveMutation.isPending || deleteMutation.isPending}
            onClick={() =>
              archiveMutation.mutate({ beanId: bean.id, isArchived: !bean.isArchived })
            }
          >
            <Archive size={16} className="mr-2" />
            {bean.isArchived ? "アーカイブから戻す" : "アーカイブする"}
          </Button>
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={archiveMutation.isPending || deleteMutation.isPending}
            onClick={() => {
              if (window.confirm("この豆を削除しますか？抽出記録は削除されません。")) {
                deleteMutation.mutate(bean.id);
              }
            }}
          >
            <Trash2 size={16} className="mr-2" /> 削除する
          </Button>
        </div>
        {(archiveMutation.isError || deleteMutation.isError) && (
          <p className="text-center text-sm text-red-600">
            操作に失敗しました。もう一度お試しください。
          </p>
        )}
      </div>
    </div>
  );
};

export default BeanDetail;
