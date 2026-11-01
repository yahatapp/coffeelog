import styles from "./content.module.css";
import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
const NotFound = () => {
  return (
    <div className={[styles.stack, styles.center, styles.state].join(" ")}>
      <div className={[styles.tonal, styles.pill, styles.roomy, styles.separated].join(" ")}>
        <AlertCircle size={64} className={styles.accent} />
      </div>
      <h2 className={[styles.hero, styles.strong, styles.accent, styles.separated].join(" ")}>
        ページが見つかりません
      </h2>
      <p className={[styles.muted, styles.separated].join(" ")}>
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      <Button asChild type="button">
        <Link to="/">
          <Home size={18} />
          ホームへ戻る
        </Link>
      </Button>
    </div>
  );
};
export default NotFound;
