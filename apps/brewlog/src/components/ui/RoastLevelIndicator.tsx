import { Chip } from "@yahatapp/ui";
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
    <Chip className={className} title={label}>
      <span className={styles.dot} data-level={level} aria-hidden="true" />
      <span className={styles.visuallyHidden}>焙煎度: </span>
      <span className={showLabel ? undefined : styles.visuallyHidden}>{label}</span>
    </Chip>
  );
}
export default RoastLevelIndicator;
