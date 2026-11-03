import styles from "./forms.module.css";
import { getFirstValidationError } from "./formValidation";
import { Field, Select } from "@yahatapp/ui";
import { Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PREFECTURES } from "@yahatapp/database/store-contracts";
import { storeQueries } from "@/lib/queries";
import { Input } from "../ui/input";
import "../ui/label";
import { Button } from "../ui/button";
import type { BeanFormApi } from "./types";
export function BeanStoreFields({ form, disabled }: { form: BeanFormApi; disabled: boolean }) {
  const storesQuery = useQuery(storeQueries.all());
  return (
    <div className={styles.panel}>
      <form.Field name="storeId">
        {(field) => (
          <div className={styles.field}>
            <Field
              id="bean-store"
              label={<>購入店 (任意)</>}
              error={getFirstValidationError(field.state.meta.errors)}
              description={<>Cafelogに登録したお店も選択できます。</>}
            >
              {(control) => (
                <>
                  <Select
                    {...control}
                    id="bean-store"
                    value={field.state.value}
                    disabled={disabled}
                    aria-busy={storesQuery.isPending}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  >
                    <option value="">登録しない</option>
                    {(storesQuery.data ?? []).map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                        {store.prefecture ? ` (${store.prefecture})` : ""}
                      </option>
                    ))}
                    <option value="new">新しいお店を登録</option>
                  </Select>

                  {storesQuery.isPending && (
                    <p role="status" className={styles.helper}>
                      店舗を読み込み中...
                    </p>
                  )}
                  {storesQuery.isError && (
                    <div role="alert" className={styles.error}>
                      店舗一覧を取得できませんでした。
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void storesQuery.refetch()}
                      >
                        再読み込み
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Field>
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.storeId}>
        {(storeId) =>
          storeId === "new" ? (
            <div className={styles.stack}>
              <form.Field name="storeName">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="bean-store-name"
                      label={<>店舗名</>}
                      required
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="bean-store-name"
                            required
                            value={field.state.value}
                            disabled={disabled}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="例: ロースタリー ○○店"
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
              <form.Field name="storePrefecture">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="bean-store-prefecture"
                      label={<>都道府県</>}
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Select
                            {...control}
                            id="bean-store-prefecture"
                            value={field.state.value}
                            disabled={disabled}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                          >
                            <option value="">選択してください (任意)</option>
                            {PREFECTURES.map((prefecture) => (
                              <option key={prefecture} value={prefecture}>
                                {prefecture}
                              </option>
                            ))}
                          </Select>
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
              <form.Field name="storeLinks" mode="array">
                {(field) => (
                  <div
                    className={styles.field}
                    role="group"
                    aria-labelledby="beanstorefields-group-1"
                  >
                    <span id="beanstorefields-group-1" className={styles.groupLabel}>
                      お店のリンク (任意)
                    </span>
                    {field.state.value.map((_, index) => (
                      <form.Field key={index} name={`storeLinks[${index}]`}>
                        {(link) => (
                          <div className={styles.row}>
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
                              size="icon"
                              disabled={disabled}
                              aria-label={`お店のリンク ${index + 1}を削除`}
                              onClick={() =>
                                field.handleChange(
                                  field.state.value.filter((_, linkIndex) => linkIndex !== index),
                                )
                              }
                            >
                              <Trash2 size={18} aria-hidden="true" />
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
