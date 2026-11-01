import { getCountryCode } from "@yahatapp/coffee-reference";
import { Globe } from "lucide-react";
import styles from "./origin-flag.module.css";
type OriginFlagProps = { origin: string | null | undefined; size?: "sm" | "md" | "lg" };
const toFlagEmoji = (code: string) =>
  String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + 127397,
    code.toUpperCase().charCodeAt(1) + 127397,
  );
const sizes = { sm: styles.small, md: styles.medium, lg: styles.large };
export const OriginFlag = ({ origin, size = "md" }: OriginFlagProps) => {
  const code = getCountryCode(origin);
  return (
    <span
      className={[styles.root, sizes[size]].join(" ")}
      role="img"
      aria-label={code ? `${origin}の国旗` : origin ? `${origin}（国旗なし）` : "産地未登録"}
    >
      {code ? toFlagEmoji(code) : <Globe aria-hidden="true" className={styles.globe} />}
    </span>
  );
};
