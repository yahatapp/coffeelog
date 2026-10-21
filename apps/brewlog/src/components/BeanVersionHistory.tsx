import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight, History, Loader2 } from "lucide-react";
import { beanQueries, type Bean } from "@/lib/queries";
import { getBeanGroupId, getBeanVersionLabel, sortBeanVersions } from "@/lib/bean-versions";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const formatCreatedAt = (date: string) =>
  new Date(date).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });

export const BeanVersionHistory = ({ bean }: { bean: Bean }) => {
  const beansQuery = useQuery(beanQueries.all());
  const versions = sortBeanVersions(
    (beansQuery.data ?? []).filter((version) => getBeanGroupId(version) === getBeanGroupId(bean)),
  );

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-coffee-primary">
          <History size={16} aria-hidden="true" /> バージョン履歴
        </h3>
        {beansQuery.isPending ? (
          <p
            className="flex min-h-16 items-center gap-2 text-sm text-coffee-secondary"
            role="status"
          >
            <Loader2 size={16} className="animate-spin" /> 履歴を読み込み中
          </p>
        ) : beansQuery.isError ? (
          <div className="min-h-16 text-sm text-coffee-secondary" role="status">
            <p>バージョン履歴を取得できませんでした。</p>
            <Button variant="ghost" onClick={() => void beansQuery.refetch()}>
              再読み込み
            </Button>
          </div>
        ) : versions.length === 0 ? (
          <p className="min-h-16 text-sm text-coffee-secondary">バージョン履歴はありません。</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version, index) => (
              <li key={version.id}>
                <Link
                  to={`/beans/${version.id}`}
                  aria-current={version.id === bean.id ? "page" : undefined}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-coffee-primary/15 p-4 transition-colors hover:bg-coffee-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary aria-[current=page]:bg-coffee-primary/5"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="break-words text-sm font-semibold text-coffee-primary">
                      {getBeanVersionLabel(version)}
                    </p>
                    <p className="text-xs text-coffee-secondary">
                      登録日: {formatCreatedAt(version.createdAt)}
                    </p>
                    <p className="flex flex-wrap gap-2 text-xs text-coffee-secondary">
                      {index === 0 && <span>最新</span>}
                      {version.id === bean.id && <span>表示中</span>}
                      {version.isArchived && <span>アーカイブ済み</span>}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-coffee-secondary"
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
