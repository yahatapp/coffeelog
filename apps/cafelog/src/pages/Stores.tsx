import styles from "./content.module.css";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  EmptyState,
  ErrorState,
  Loading,
  StoreHistory,
  StoreList,
  useStoreListOptions,
  PageHeading,
  useAppBack,
} from "@yahatapp/ui";
import { cafelogQueries } from "@/lib/queries";

const StoreHeader = () => {
  const goBack = useAppBack("/settings");
  return (
    <div className={styles.titleRow}>
      <Button variant="ghost" size="icon" aria-label="設定へ戻る" onClick={goBack}>
        <ArrowLeft size={20} aria-hidden="true" />
      </Button>
      <PageHeading className={styles.heading}>お店</PageHeading>
    </div>
  );
};

export default function StoresPage() {
  const navigate = useNavigate();
  const list = useStoreListOptions();
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
        <StoreList
          {...list}
          stores={query.data}
          onSelect={(id) => void navigate(`/stores/${id}`)}
          linkSpacing="compact"
        />
      )}
    </div>
  );
}

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useAppBack("/stores");
  const query = useQuery(cafelogQueries.store(id ?? ""));
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Button variant="ghost" size="icon" aria-label="店舗一覧へ戻る" onClick={goBack}>
          <ArrowLeft size={20} aria-hidden="true" />
        </Button>
        <PageHeading className={styles.heading}>お店の詳細</PageHeading>
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
