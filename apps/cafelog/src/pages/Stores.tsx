import styles from "./content.module.css";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, EmptyState, ErrorState, Loading, StoreHistory, StoreList } from "@yahatapp/ui";
import { cafelogQueries } from "@/lib/queries";

const StoreHeader = () => (
  <div className={styles.titleRow}>
    <Button asChild variant="ghost" size="icon">
      <Link to="/settings" aria-label="設定へ戻る">
        <ArrowLeft size={20} aria-hidden="true" />
      </Link>
    </Button>
    <h2 className={styles.heading}>お店</h2>
  </div>
);

export default function StoresPage() {
  const navigate = useNavigate();
  const query = useQuery(cafelogQueries.stores());
  return (
    <div className={styles.page}>
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
  const query = useQuery(cafelogQueries.store(id ?? ""));
  return (
    <div className={styles.page}>
      <div>
        <Button asChild variant="ghost">
          <Link to="/stores">
            <ArrowLeft size={18} aria-hidden="true" />
            店舗一覧へ
          </Link>
        </Button>
      </div>
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
          onOpenCafeRecord={(recordId) => void navigate(`/logs/${recordId}`)}
        />
      )}
    </div>
  );
}
