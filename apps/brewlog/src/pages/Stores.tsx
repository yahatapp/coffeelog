import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { EmptyState, ErrorState, Loading, StoreHistory, StoreList } from "@yahatapp/ui";
import { storeQueries } from "@/lib/queries";

const StoreHeader = () => (
  <div className="flex items-center gap-2">
    <Link
      to="/settings"
      aria-label="設定へ戻る"
      className="flex size-11 items-center justify-center rounded-full text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft size={20} />
    </Link>
    <h2 className="text-xl font-bold text-primary">お店</h2>
  </div>
);

export default function StoresPage() {
  const navigate = useNavigate();
  const query = useQuery(storeQueries.all());
  return (
    <div className="space-y-5">
      <StoreHeader />
      {query.isPending ? (
        <Loading label="店舗を読み込み中..." />
      ) : query.isError ? (
        <ErrorState
          message="店舗一覧を取得できませんでした。"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <StoreList stores={query.data} onSelect={(id) => void navigate(`/stores/${id}`)} />
      )}
    </div>
  );
}

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useQuery(storeQueries.detail(id ?? ""));
  return (
    <div className="space-y-5">
      <Link
        to="/stores"
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft size={18} />
        店舗一覧へ
      </Link>
      {!id ? (
        <EmptyState title="店舗が見つかりませんでした。" />
      ) : query.isPending ? (
        <Loading label="お店の記録を読み込み中..." />
      ) : query.isError ? (
        <ErrorState
          message="お店の記録を取得できませんでした。"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <StoreHistory
          {...query.data}
          onOpenBrewRecord={(recordId) => void navigate(`/logs/${recordId}`)}
        />
      )}
    </div>
  );
}
