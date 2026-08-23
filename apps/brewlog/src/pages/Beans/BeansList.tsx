import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Coffee, ChevronRight, Loader2, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { OriginFlag } from "../../components/ui/OriginFlag";
import { getCountryCode } from "@/utils/flag";
import { CoffeeBeansIcon } from "../../components/ui/CoffeeBeansIcon";
import { RoastLevelIndicator } from "../../components/ui/RoastLevelIndicator";

interface Bean {
  id: string;
  parentBeanId?: string | null;
  version?: string | null;
  name: string;
  origin: string | null;
  purchaseStore: string | null;
  roastLevel: number | null;
  purchaseDate: string | null;
  isArchived: boolean;
  createdAt: string;
  processMethod?: string | null;
}

interface BeanGroup {
  groupId: string;
  latestBean: Bean;
  allBeans: Bean[];
  versionCount: number;
}

const BeansList = () => {
  const navigate = useNavigate();
  const [beans, setBeans] = useState<Bean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<BeanGroup | null>(null);

  useEffect(() => {
    const fetchBeans = async () => {
      try {
        const res = await api.api.beans.$get();
        if (res.ok) {
          const data = await res.json();
          setBeans(data);
        }
      } catch (err) {
        console.error("Failed to fetch beans", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchBeans();
  }, []);

  const activeBeans = beans.filter((bean) => !bean.isArchived);

  const groupedBeans = useMemo(() => {
    const groups: Record<string, Bean[]> = {};
    activeBeans.forEach((bean) => {
      const groupId = bean.parentBeanId || bean.id;
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(bean);
    });

    return Object.entries(groups)
      .map(([groupId, groupBeans]) => {
        const sorted = [...groupBeans].toSorted(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return {
          groupId,
          latestBean: sorted[0],
          allBeans: sorted,
          versionCount: sorted.length,
        };
      })
      .toSorted(
        (a, b) =>
          new Date(b.latestBean.createdAt).getTime() - new Date(a.latestBean.createdAt).getTime(),
      );
  }, [activeBeans]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-coffee-primary">コーヒー豆一覧</h2>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => navigate("/beans/new")}
        >
          <Plus size={16} className="mr-1" /> 追加
        </Button>
      </div>

      {groupedBeans.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <Coffee className="mx-auto text-coffee-secondary/30 mb-4" size={48} />
            <p className="text-coffee-secondary text-sm">登録されている豆はありません。</p>
            <p className="text-xs text-coffee-secondary/60 mt-2">
              お気に入りの豆を登録しましょう！
            </p>
            <Button className="mt-6 rounded-xl" onClick={() => navigate("/beans/new")}>
              豆を登録する
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedBeans.map((group) => {
            const { latestBean, versionCount } = group;
            return (
              <Card
                key={group.groupId}
                className="hover:border-coffee-primary/30 transition-colors cursor-pointer group"
                onClick={() => setSelectedGroup(group)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="bg-coffee-background w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-coffee-primary/10 transition-colors flex-shrink-0 overflow-hidden">
                      {(() => {
                        const countryCode = getCountryCode(latestBean.origin);
                        const isBlend =
                          !latestBean.origin ||
                          latestBean.origin.toLowerCase().includes("ブレンド") ||
                          latestBean.origin.toLowerCase().includes("blend") ||
                          latestBean.name.toLowerCase().includes("ブレンド") ||
                          latestBean.name.toLowerCase().includes("blend");

                        if (!isBlend && countryCode) {
                          return <OriginFlag origin={latestBean.origin} size={24} />;
                        }

                        return <CoffeeBeansIcon size={24} className="text-coffee-primary" />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-coffee-text truncate">{latestBean.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {versionCount > 0 && (
                          <span className="text-[10px] text-coffee-primary bg-coffee-primary/10 px-2 py-0.5 rounded-full font-bold">
                            {versionCount}バージョン
                          </span>
                        )}
                        <span className="text-[10px] text-coffee-secondary bg-coffee-secondary/10 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                          最新:{" "}
                          {latestBean.version ||
                            latestBean.purchaseDate?.replace(/-/g, ".") ||
                            "未設定"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 hidden sm:flex">
                        {latestBean.origin && (
                          <span className="text-[10px] text-coffee-secondary bg-coffee-secondary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <OriginFlag origin={latestBean.origin} size={10} />
                            {latestBean.origin}
                          </span>
                        )}
                        {latestBean.purchaseStore && (
                          <span className="text-[10px] text-coffee-secondary bg-coffee-secondary/10 px-2 py-0.5 rounded-full">
                            {latestBean.purchaseStore}
                          </span>
                        )}
                        {latestBean.processMethod && (
                          <span className="text-[10px] text-coffee-secondary bg-coffee-secondary/10 px-2 py-0.5 rounded-full">
                            {latestBean.processMethod}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                    {latestBean.roastLevel && <RoastLevelIndicator level={latestBean.roastLevel} />}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void navigate(`/beans/${latestBean.id}/edit`);
                        }}
                        className="p-2 text-coffee-secondary hover:text-coffee-primary hover:bg-coffee-secondary/10 rounded-full transition-colors"
                        title="最新の豆を編集"
                      >
                        <Pencil size={16} />
                      </button>
                      <ChevronRight
                        size={18}
                        className="text-coffee-secondary/40 group-hover:text-coffee-primary transition-colors"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in"
          onClick={() => setSelectedGroup(null)}
        >
          <Card
            className="w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-coffee-primary/5 border-b border-coffee-primary/10">
              <h3 className="font-bold text-coffee-primary text-lg">
                {selectedGroup.latestBean.name}
              </h3>
              <p className="text-sm text-coffee-secondary mt-1">
                最新バージョン:{" "}
                {selectedGroup.latestBean.version ||
                  selectedGroup.latestBean.purchaseDate?.replace(/-/g, ".") ||
                  "未設定"}
              </p>
            </div>
            <div className="p-4 space-y-3">
              <Button
                className="w-full justify-start h-12 rounded-xl"
                onClick={() => navigate(`/logs/new?beanId=${selectedGroup.latestBean.id}`)}
              >
                <Coffee size={18} className="mr-3" />
                この豆で抽出記録をつける
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 rounded-xl border-coffee-primary/20 hover:bg-coffee-primary/5"
                onClick={() => navigate(`/beans/new?parentBeanId=${selectedGroup.groupId}`)}
              >
                <Plus size={18} className="mr-3 text-coffee-primary" />
                同じ豆の新しいバージョン(購入)を追加する
              </Button>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGroup(null)}
                className="rounded-lg"
              >
                キャンセル
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BeansList;
