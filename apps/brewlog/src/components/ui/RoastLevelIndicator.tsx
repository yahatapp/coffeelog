import { clsx } from "clsx";
import { getRoastLabel } from "@yahatapp/coffee-reference";
import styles from "./roast-level.module.css";
export { getRoastLabel };
interface RoastLevelIndicatorProps {
  level: number;
  className?: string;
  showLabel?: boolean;
}
export function RoastLevelIndicator({
  level,
  className,
  showLabel = true,
}: RoastLevelIndicatorProps) {
  const label = getRoastLabel(level);
  return (
    <span className={clsx(styles.root, className)} title={label}>
      <span className={styles.dot} data-level={level} aria-hidden="true" />
      <span className={styles.visuallyHidden}>焙煎度: </span>
      <span className={showLabel ? styles.label : styles.visuallyHidden}>{label}</span>
    </span>
  );
}
export default RoastLevelIndicator;
