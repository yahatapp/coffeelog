import styles from "./content.module.css";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, EmptyState, ErrorState, Loading, StoreHistory, StoreList } from "@yahatapp/ui";
import { storeQueries } from "@/lib/queries";
const StoreHeader = () => (
  <div className={styles.row}>
    <Button asChild variant="ghost" size="icon">
      <Link to="/settings" aria-label="設定へ戻る">
        <ArrowLeft size={20} aria-hidden="true" />
      </Link>
    </Button>
    <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>お店</h2>
  </div>
);
export default function StoresPage() {
  const navigate = useNavigate();
  const query = useQuery(storeQueries.all());
  return (
    <div className={styles.stack}>
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
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const query = useQuery(storeQueries.detail(id ?? ""));
  return (
    <div className={styles.stack}>
      <Link
        to="/stores"
        className={[styles.pill, styles.row, styles.target, styles.body, styles.accent].join(" ")}
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
