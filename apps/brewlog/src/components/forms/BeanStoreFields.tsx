import { useQuery } from "@tanstack/react-query";
import { PREFECTURES } from "@yahatapp/database/store-contracts";
import { storeQueries } from "@/lib/queries";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { BeanFormApi } from "./types";

export function BeanStoreFields({ form, disabled }: { form: BeanFormApi; disabled: boolean }) {
  const storesQuery = useQuery(storeQueries.all());
  return (
    <div className="space-y-4 rounded-2xl bg-coffee-primary/5 p-4">
      <form.Field name="storeId">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="bean-store">購入店 (任意)</Label>
            <select
              id="bean-store"
              value={field.state.value}
              disabled={disabled}
              aria-busy={storesQuery.isPending}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="min-h-11 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 text-sm text-coffee-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary"
            >
              <option value="">登録しない</option>
              {(storesQuery.data ?? []).map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                  {store.prefecture ? ` (${store.prefecture})` : ""}
                </option>
              ))}
              <option value="new">新しいお店を登録</option>
            </select>
            <p className="text-xs text-coffee-secondary">Cafelogに登録したお店も選択できます。</p>
            {storesQuery.isPending && (
              <p role="status" className="text-xs text-coffee-secondary">
                店舗を読み込み中...
              </p>
            )}
            {storesQuery.isError && (
              <div role="alert" className="text-xs text-red-600">
                店舗一覧を取得できませんでした。
                <Button type="button" variant="ghost" onClick={() => void storesQuery.refetch()}>
                  再読み込み
                </Button>
              </div>
            )}
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.storeId}>
        {(storeId) =>
          storeId === "new" ? (
            <div className="space-y-4">
              <form.Field name="storeName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="bean-store-name">店舗名</Label>
                    <Input
                      id="bean-store-name"
                      required
                      value={field.state.value}
                      disabled={disabled}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="例: ロースタリー ○○店"
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="storePrefecture">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="bean-store-prefecture">都道府県</Label>
                    <select
                      id="bean-store-prefecture"
                      value={field.state.value}
                      disabled={disabled}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      className="min-h-11 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary"
                    >
                      <option value="">選択してください (任意)</option>
                      {PREFECTURES.map((prefecture) => (
                        <option key={prefecture} value={prefecture}>
                          {prefecture}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form.Field>
              <form.Field name="storeLinks" mode="array">
                {(field) => (
                  <div className="space-y-2">
                    <Label>お店のリンク (任意)</Label>
                    {field.state.value.map((_, index) => (
                      <form.Field key={index} name={`storeLinks[${index}]`}>
                        {(link) => (
                          <div className="flex items-center gap-2">
                            <Input
                              type="url"
                              aria-label={`お店のリンク ${index + 1}`}
                              value={link.state.value}
                              disabled={disabled}
                              onChange={(event) => link.handleChange(event.target.value)}
                              onBlur={link.handleBlur}
                              placeholder="Instagram・ホームページ・Google Map"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="min-h-11 shrink-0 whitespace-nowrap"
                              disabled={disabled}
                              aria-label={`お店のリンク ${index + 1}を削除`}
                              onClick={() =>
                                field.handleChange(
                                  field.state.value.filter((_, linkIndex) => linkIndex !== index),
                                )
                              }
                            >
                              削除
                            </Button>
                          </div>
                        )}
                      </form.Field>
                    ))}
                    {field.state.value.length < 10 && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => field.handleChange([...field.state.value, ""])}
                      >
                        リンクを追加
                      </Button>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
          ) : null
        }
      </form.Subscribe>
    </div>
  );
}
