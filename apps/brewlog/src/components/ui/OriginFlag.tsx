import { clsx } from "clsx";
import { getCountryCode } from "@/utils/flag";
import { Globe } from "lucide-react";
import styles from "./origin-flag.module.css";
interface OriginFlagProps {
  origin: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}
const sizes = { sm: styles.small, md: styles.medium, lg: styles.large };
export function OriginFlag({ origin, className, size = "md" }: OriginFlagProps) {
  const code = getCountryCode(origin);
  if (!code)
    return (
      <Globe
        className={clsx(styles.fallback, sizes[size], className)}
        role="img"
        aria-label={origin || "産地未登録"}
      />
    );
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={origin || "産地"}
      className={clsx(styles.flag, sizes[size], className)}
      loading="lazy"
    />
  );
}
export default OriginFlag;
