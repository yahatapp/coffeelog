import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Save, Star } from "lucide-react";
import { useState } from "react";
import { Button, ErrorState, Field, Input, Select, Textarea } from "@yahatapp/ui";
import { ImagePicker } from "@/components/ImagePicker";
import { FloatingNotice } from "@/components/FloatingNotice";
import { ProcessField } from "@/components/ProcessField";
import { Segment } from "@/components/Segment";
import { cafeLogFormSchema, type CafeLogFormValues } from "@/lib/cafeLogForm";
import { FREQUENT_PREFECTURES, PREFECTURE_GROUPS } from "@/lib/prefectures";
import { cafelogQueries } from "@/lib/queries";
import styles from "./cafe-form.module.css";

type CafeLogFormProps = {
  defaultValues: CafeLogFormValues;
  onSubmit: (values: CafeLogFormValues) => Promise<void>;
  error?: string | null;
  warning?: string | null;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  maxImages?: number;
};

const errorMessage = (errors: readonly unknown[]) => {
  const error = errors[0];
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return typeof error.message === "string" ? error.message : null;
  }
  return error ? "入力内容を確認してください。" : null;
};

const coffeeFields = [
  { name: "origin", label: "原産国", placeholder: "例: エチオピア" },
  { name: "variety", label: "品種", placeholder: "例: ゲイシャ" },
  { name: "region", label: "地域", placeholder: "例: シダマ" },
  { name: "farm", label: "農園", placeholder: "例: コピア農園" },
  { name: "producer", label: "生産者", placeholder: "例: ホセ・ヒラルド" },
] as const;

export const CafeLogForm = ({
  defaultValues,
  onSubmit,
  error,
  warning,
  submitLabel,
  isSubmitting = false,
  onCancel,
  maxImages = 5,
}: CafeLogFormProps) => {
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageErrorId, setImageErrorId] = useState(0);
  const storesQuery = useQuery(cafelogQueries.stores());
  const form = useForm({
    defaultValues,
    validators: { onSubmit: cafeLogFormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isSubmitting) void form.handleSubmit();
      }}
      className={styles.form}
    >
      {(error || imageError || warning) && (
        <FloatingNotice
          key={`${error || imageError || warning}:${imageErrorId}`}
          message={error || imageError || warning || ""}
          warning={!error && !imageError}
        />
      )}
      <fieldset disabled={isSubmitting} className={styles.fields}>
        <div className={styles.panel}>
          <form.Field name="cafeName">
            {(field) => (
              <Field
                id="cafe-name"
                label="店舗名"
                required
                error={errorMessage(field.state.meta.errors)}
              >
                {(control) => (
                  <>
                    <Input
                      {...control}
                      type="text"
                      list="registered-stores"
                      value={field.state.value}
                      onChange={(event) => {
                        const name = event.target.value;
                        field.handleChange(name);
                        const matches = (storesQuery.data ?? []).filter(
                          (store) => store.name === name,
                        );
                        if (matches.length === 1) {
                          form.setFieldValue("prefecture", matches[0].prefecture ?? "");
                          form.setFieldValue(
                            "cafeLinks",
                            matches[0].links.length ? matches[0].links : [""],
                          );
                        }
                      }}
                      onBlur={field.handleBlur}
                      placeholder="例: ブルーボトルコーヒー"
                    />
                    <datalist id="registered-stores">
                      {(storesQuery.data ?? []).map((store) => (
                        <option key={store.id} value={store.name}>
                          {store.prefecture ?? ""}
                        </option>
                      ))}
                    </datalist>
                  </>
                )}
              </Field>
            )}
          </form.Field>
          {storesQuery.isError && (
            <ErrorState
              message="店舗候補を取得できませんでした。店舗名は手入力できます。"
              onRetry={() => void storesQuery.refetch()}
            />
          )}
          <form.Field name="prefecture">
            {(field) => (
              <Field
                id="cafe-prefecture"
                label="都道府県"
                error={errorMessage(field.state.meta.errors)}
              >
                {(control) => (
                  <Select
                    {...control}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  >
                    <option value="">選択してください</option>
                    <optgroup label="よく行く都道府県">
                      {FREQUENT_PREFECTURES.map((prefecture) => (
                        <option key={prefecture} value={prefecture}>
                          {prefecture}
                        </option>
                      ))}
                    </optgroup>
                    {PREFECTURE_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.prefectures.map((prefecture) => (
                          <option key={prefecture} value={prefecture}>
                            {prefecture}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                )}
              </Field>
            )}
          </form.Field>
          <form.Field name="isBlend">
            {(field) => (
              <fieldset className={styles.group}>
                <legend className={styles.legend}>豆の種類</legend>
                <Segment
                  value={field.state.value ? "blend" : "single"}
                  onValueChange={(value) => field.handleChange(value === "blend")}
                  options={[
                    { label: "シングル", value: "single" },
                    { label: "ブレンド", value: "blend" },
                  ]}
                  ariaLabel="豆の種類"
                />
              </fieldset>
            )}
          </form.Field>
          <form.Field name="cafeLinks" mode="array">
            {(field) => (
              <fieldset className={styles.group}>
                <legend className={styles.legend}>お店のリンク</legend>
                {field.state.value.map((_, index) => (
                  <form.Field key={index} name={`cafeLinks[${index}]`}>
                    {(linkField) => (
                      <div className={styles.dynamicRow}>
                        <Field
                          label={`お店のリンク ${index + 1}`}
                          error={errorMessage(linkField.state.meta.errors)}
                        >
                          {(control) => (
                            <Input
                              {...control}
                              type="url"
                              value={linkField.state.value}
                              onChange={(event) => linkField.handleChange(event.target.value)}
                              onBlur={linkField.handleBlur}
                              placeholder="Instagram・ホームページ・Google Map"
                            />
                          )}
                        </Field>
                        <div className={styles.remove}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`リンク ${index + 1} を削除`}
                            onClick={() => field.removeValue(index)}
                          >
                            <Minus size={18} aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </form.Field>
                ))}
                {field.state.value.length < 10 && (
                  <Button type="button" variant="ghost" onClick={() => field.pushValue("")}>
                    <Plus size={14} aria-hidden="true" />
                    リンクを追加
                  </Button>
                )}
                {errorMessage(field.state.meta.errors) && (
                  <p className={styles.error} role="alert">
                    {errorMessage(field.state.meta.errors)}
                  </p>
                )}
              </fieldset>
            )}
          </form.Field>
          <div className={styles.coffeeFields}>
            {coffeeFields.map(({ name, label, placeholder }) => (
              <form.Field key={name} name={name}>
                {(field) => (
                  <Field
                    id={`cafe-${name}`}
                    label={label}
                    error={errorMessage(field.state.meta.errors)}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        type="text"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={placeholder}
                      />
                    )}
                  </Field>
                )}
              </form.Field>
            ))}
          </div>
          <form.Field name="process">
            {(field) => (
              <ProcessField
                id="cafe-process"
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                error={errorMessage(field.state.meta.errors)}
              >
                <form.Field name="roast">
                  {(roastField) => (
                    <Field
                      id="cafe-roast"
                      label="焙煎度"
                      error={errorMessage(roastField.state.meta.errors)}
                    >
                      {(control) => (
                        <Input
                          {...control}
                          type="text"
                          value={roastField.state.value}
                          onChange={(event) => roastField.handleChange(event.target.value)}
                          onBlur={roastField.handleBlur}
                          placeholder="例: 浅煎り"
                        />
                      )}
                    </Field>
                  )}
                </form.Field>
              </ProcessField>
            )}
          </form.Field>
          <form.Field name="servingStyle">
            {(field) => (
              <fieldset className={styles.group}>
                <legend className={styles.legend}>提供温度</legend>
                <Segment
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  options={[
                    { label: "ホット", value: "hot" },
                    { label: "アイス", value: "iced" },
                  ]}
                  ariaLabel="提供温度"
                />
              </fieldset>
            )}
          </form.Field>
          <form.Field name="flavorNotes" mode="array">
            {(field) => (
              <fieldset className={styles.group}>
                <legend className={styles.legend}>フレーバーノート</legend>
                {field.state.value.map((_, index) => (
                  <form.Field key={index} name={`flavorNotes[${index}]`}>
                    {(noteField) => (
                      <div className={styles.dynamicRow}>
                        <Field
                          label={`フレーバーノート ${index + 1}`}
                          labelVariant="secondary"
                          error={errorMessage(noteField.state.meta.errors)}
                        >
                          {(control) => (
                            <Input
                              {...control}
                              type="text"
                              value={noteField.state.value}
                              onChange={(event) => noteField.handleChange(event.target.value)}
                              onBlur={noteField.handleBlur}
                              placeholder="例: ベリー"
                            />
                          )}
                        </Field>
                        <div className={styles.remove}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`フレーバーノート ${index + 1}を削除`}
                            onClick={() => field.removeValue(index)}
                          >
                            <Minus size={18} aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </form.Field>
                ))}
                <Button type="button" variant="ghost" onClick={() => field.pushValue("")}>
                  <Plus size={14} aria-hidden="true" />
                  フレーバーを追加
                </Button>
              </fieldset>
            )}
          </form.Field>
          <form.Field name="rating">
            {(field) => (
              <fieldset className={styles.group}>
                <legend className={styles.legend}>評価</legend>
                <div className={styles.rating}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="評価を下げる"
                    onClick={() =>
                      field.handleChange(
                        field.state.value !== null ? Math.max(1, field.state.value - 0.5) : 3,
                      )
                    }
                    disabled={field.state.value !== null && field.state.value <= 1}
                  >
                    <Minus size={18} aria-hidden="true" />
                  </Button>
                  <div className={styles.ratingValue}>
                    <div className={styles.stars} aria-hidden="true">
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index} className={styles.star}>
                          <Star size={20} className={styles.starEmpty} />
                          {field.state.value !== null && field.state.value > index && (
                            <span
                              className={styles.starFill}
                              data-half={field.state.value < index + 1 || undefined}
                            >
                              <Star size={20} />
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                    <output aria-label="評価">
                      {field.state.value !== null ? field.state.value.toFixed(1) : "未登録"} / 5.0
                    </output>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="評価を上げる"
                    onClick={() =>
                      field.handleChange(
                        field.state.value !== null ? Math.min(5, field.state.value + 0.5) : 3,
                      )
                    }
                    disabled={field.state.value !== null && field.state.value >= 5}
                  >
                    <Plus size={18} aria-hidden="true" />
                  </Button>
                </div>
              </fieldset>
            )}
          </form.Field>
          <div className={styles.measurements}>
            <form.Field name="price">
              {(field) => (
                <Field
                  id="cafe-price"
                  label="金額 (円)"
                  error={errorMessage(field.state.meta.errors)}
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="number"
                      min="0"
                      step="1"
                      pattern="[0-9]*"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="550"
                    />
                  )}
                </Field>
              )}
            </form.Field>
            <form.Field name="visitDate">
              {(field) => (
                <Field
                  id="cafe-visit-date"
                  label="訪問日"
                  error={errorMessage(field.state.meta.errors)}
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  )}
                </Field>
              )}
            </form.Field>
          </div>
          <form.Field name="note">
            {(field) => (
              <Field
                id="cafe-note"
                label="メモ / 味の感想"
                error={errorMessage(field.state.meta.errors)}
              >
                {(control) => (
                  <Textarea
                    {...control}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="味の特徴、豆の情報、お店の雰囲気など..."
                    rows={4}
                  />
                )}
              </Field>
            )}
          </form.Field>
          <form.Field name="images">
            {(field) => (
              <ImagePicker
                images={field.state.value}
                onChange={field.handleChange}
                onError={(message) => {
                  setImageError(message);
                  if (message) setImageErrorId((current) => current + 1);
                }}
                maxImages={maxImages}
              />
            )}
          </form.Field>
        </div>
        <div className={styles.actions}>
          <Button type="submit" loading={isSubmitting} fullWidth>
            <Save size={18} aria-hidden="true" />
            {isSubmitting ? "保存中..." : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
};
