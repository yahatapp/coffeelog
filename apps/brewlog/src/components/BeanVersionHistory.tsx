import styles from "./bean-history.module.css";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@yahatapp/ui";
import { beanQueries, type Bean } from "@/lib/queries";
import { getBeanGroupId, getBeanVersionLabel, sortBeanVersions } from "@/lib/bean-versions";
const formatCreatedAt = (date: string) =>
  new Date(date).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
export const BeanVersionHistory = ({ bean }: { bean: Bean }) => {
  const beansQuery = useQuery(beanQueries.all());
  const versions = sortBeanVersions(
    (beansQuery.data ?? []).filter((version) => getBeanGroupId(version) === getBeanGroupId(bean)),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>バージョン履歴</CardTitle>
      </CardHeader>
      <CardContent>
        {beansQuery.isPending ? (
          <p className={[styles.row, styles.body, styles.muted].join(" ")} role="status">
            <Loader2 size={16} className={styles.spinner} /> 履歴を読み込み中
          </p>
        ) : beansQuery.isError ? (
          <div className={[styles.body, styles.muted].join(" ")} role="status">
            <p>バージョン履歴を取得できませんでした。</p>
            <Button variant="ghost" onClick={() => void beansQuery.refetch()} type="button">
              再読み込み
            </Button>
          </div>
        ) : versions.length === 0 ? (
          <p className={[styles.body, styles.muted].join(" ")}>バージョン履歴はありません。</p>
        ) : (
          <ul className={styles.fieldStack}>
            {versions.map((version, index) => (
              <li key={version.id}>
                <Link
                  to={`/beans/${version.id}`}
                  aria-current={version.id === bean.id ? "page" : undefined}
                  className={[
                    styles.tonal,
                    styles.border,
                    styles.rounded,
                    styles.content,
                    styles.row,
                    styles.spread,
                  ].join(" ")}
                >
                  <div className={[styles.fieldStack, styles.grow].join(" ")}>
                    <p
                      className={[styles.body, styles.strong, styles.accent, styles.wrap].join(" ")}
                    >
                      {getBeanVersionLabel(version)}
                    </p>
                    <p className={[styles.helper, styles.muted].join(" ")}>
                      登録日: {formatCreatedAt(version.createdAt)}
                    </p>
                    <p
                      className={[styles.row, styles.wrapping, styles.helper, styles.muted].join(
                        " ",
                      )}
                    >
                      {index === 0 && <span>最新</span>}
                      {version.id === bean.id && <span>表示中</span>}
                      {version.isArchived && <span>アーカイブ済み</span>}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={[styles.fixed, styles.muted].join(" ")}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
