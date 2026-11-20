import { PageHeading } from "@yahatapp/ui";
import { Link } from "react-router-dom";
import { Button } from "@yahatapp/ui";
import styles from "./content.module.css";
export default function NotFoundPage() {
  return (
    <div className={styles.notFound}>
      <PageHeading className={styles.heading}>ページが見つかりません</PageHeading>
      <p className={styles.muted}>お探しのページは存在しないようです。</p>
      <Button asChild>
        <Link to="/">ホームに戻る</Link>
      </Button>
    </div>
  );
}
