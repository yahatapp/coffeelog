import { useForm } from "@tanstack/react-form";
import { Calendar, Loader2, MessageSquare, Minus, Plus, Save, Star } from "lucide-react";
import { useState } from "react";
import { ImagePicker } from "@/components/ImagePicker";
import { ProcessField } from "@/components/ProcessField";
import { Segment } from "@/components/Segment";
import { cafeLogFormSchema, type CafeLogFormValues } from "@/lib/cafeLogForm";
import { FREQUENT_PREFECTURES, PREFECTURE_GROUPS } from "@/lib/prefectures";

type CafeLogFormProps = {
  defaultValues: CafeLogFormValues;
  onSubmit: (values: CafeLogFormValues) => Promise<void>;
  error?: string | null;
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
    const message = error.message;
    return typeof message === "string" ? message : null;
  }
  return error ? "入力内容を確認してください。" : null;
};

const renderStars = (value: number | null) => {
  if (value === null) return null;
  const fullStars = Math.floor(value);
  const hasHalf = value % 1 !== 0;

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starNumber = index + 1;
        if (starNumber <= fullStars) {
          return <Star key={starNumber} size={24} className="fill-cafe-accent text-cafe-accent" />;
        }
        if (starNumber === fullStars + 1 && hasHalf) {
          return (
            <div key={starNumber} className="relative inline-block">
              <Star size={24} className="text-cafe-secondary/20" />
              <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                <Star size={24} className="fill-cafe-accent text-cafe-accent" />
              </div>
            </div>
          );
        }
        return <Star key={starNumber} size={24} className="text-cafe-secondary/20" />;
      })}
    </div>
  );
};

export const CafeLogForm = ({
  defaultValues,
  onSubmit,
  error,
  submitLabel,
  isSubmitting = false,
  onCancel,
  maxImages = 5,
}: CafeLogFormProps) => {
  const [imageError, setImageError] = useState<string | null>(null);
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: cafeLogFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-6"
    >
      {(error || imageError) && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-xl font-semibold">
          {error || imageError}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 shadow-sm space-y-4">
        <form.Field name="cafeName">
          {(field) => (
            <div>
              <label htmlFor="cafe-name" className="text-xs font-bold text-cafe-text block mb-1.5">
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                id="cafe-name"
                type="text"
                required
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="例: ブルーボトルコーヒー"
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
              />
              {errorMessage(field.state.meta.errors) && (
                <p className="mt-1 text-xs text-red-600">{errorMessage(field.state.meta.errors)}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="prefecture">
          {(field) => (
            <div>
              <label
                htmlFor="cafe-prefecture"
                className="text-xs font-bold text-cafe-text block mb-1.5"
              >
                都道府県
              </label>
              <select
                id="cafe-prefecture"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
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
              </select>
            </div>
          )}
        </form.Field>

        <form.Field name="isBlend">
          {(field) => (
            <div>
              <label className="text-xs font-bold text-cafe-text block mb-2">豆の種類</label>
              <Segment
                value={field.state.value ? "blend" : "single"}
                onValueChange={(value) => field.handleChange(value === "blend")}
                options={[
                  { label: "シングル", value: "single" },
                  { label: "ブレンド", value: "blend" },
                ]}
                ariaLabel="豆の種類"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="cafeUrl">
          {(field) => (
            <div>
              <label htmlFor="cafe-url" className="text-xs font-bold text-cafe-text block mb-1.5">
                お店のURL
              </label>
              <input
                id="cafe-url"
                type="url"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="https://example.com"
                className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
              />
              {errorMessage(field.state.meta.errors) && (
                <p className="mt-1 text-xs text-red-600">{errorMessage(field.state.meta.errors)}</p>
              )}
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="origin">
            {(field) => (
              <div>
                <label
                  htmlFor="cafe-origin"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  原産国
                </label>
                <input
                  id="cafe-origin"
                  type="text"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="例: エチオピア"
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="variety">
            {(field) => (
              <div>
                <label
                  htmlFor="cafe-variety"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  品種
                </label>
                <input
                  id="cafe-variety"
                  type="text"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="例: ゲイシャ"
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="region">
            {(field) => (
              <div className="col-span-2">
                <label
                  htmlFor="cafe-region"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  地域
                </label>
                <input
                  id="cafe-region"
                  type="text"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="例: シダマ"
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="farm">
            {(field) => (
              <div className="col-span-2">
                <label
                  htmlFor="cafe-farm"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  農園
                </label>
                <input
                  id="cafe-farm"
                  type="text"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="例: コピア農園"
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="process">
            {(field) => (
              <div>
                <label
                  htmlFor="cafe-process"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  精製方法
                </label>
                <ProcessField
                  id="cafe-process"
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="roast">
            {(field) => (
              <div>
                <label
                  htmlFor="cafe-roast"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  焙煎度
                </label>
                <input
                  id="cafe-roast"
                  type="text"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="例: 浅煎り"
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="servingStyle">
          {(field) => (
            <div>
              <label className="text-xs font-bold text-cafe-text block mb-2">提供温度</label>
              <Segment
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                options={[
                  { label: "ホット", value: "hot" },
                  { label: "アイス", value: "iced" },
                ]}
                ariaLabel="提供温度"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="rating">
          {(field) => {
            const rating = field.state.value;
            return (
              <div>
                <label className="text-xs font-bold text-cafe-text block mb-2">評価</label>
                <div className="flex items-center justify-between bg-cafe-background border border-cafe-secondary/15 rounded-2xl p-3.5 w-full shadow-inner">
                  <button
                    type="button"
                    onClick={() =>
                      field.handleChange(rating !== null ? Math.max(1, rating - 0.5) : 3)
                    }
                    disabled={rating !== null && rating <= 1}
                    className="w-10 h-10 rounded-xl bg-white border border-cafe-secondary/20 flex items-center justify-center text-cafe-primary hover:bg-cafe-primary/5 active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white transition-all shadow-sm"
                  >
                    <Minus size={18} />
                  </button>

                  <div className="flex flex-col items-center justify-center px-4 min-w-[130px]">
                    <div className="flex items-center">{renderStars(rating)}</div>
                    <div className="inline-flex items-baseline mt-1">
                      <span className="text-xl font-extrabold text-cafe-primary leading-none">
                        {rating !== null ? rating.toFixed(1) : "3.0"}
                      </span>
                      <span className="text-[10px] font-bold text-cafe-secondary/50 mx-0.5">/</span>
                      <span className="text-[10px] font-bold text-cafe-secondary">5.0</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      field.handleChange(rating !== null ? Math.min(5, rating + 0.5) : 3)
                    }
                    disabled={rating !== null && rating >= 5}
                    className="w-10 h-10 rounded-xl bg-white border border-cafe-secondary/20 flex items-center justify-center text-cafe-primary hover:bg-cafe-primary/5 active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white transition-all shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            );
          }}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="price">
            {(field) => (
              <div>
                <label
                  htmlFor="cafe-price"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  金額 (円)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-cafe-secondary">
                    ¥
                  </span>
                  <input
                    id="cafe-price"
                    type="number"
                    min="0"
                    step="1"
                    pattern="[0-9]*"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="550"
                    className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl pl-8 pr-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all"
                  />
                </div>
                {errorMessage(field.state.meta.errors) && (
                  <p className="mt-1 text-xs text-red-600">
                    {errorMessage(field.state.meta.errors)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="visitDate">
            {(field) => (
              <div>
                <label
                  htmlFor="cafe-visit-date"
                  className="text-xs font-bold text-cafe-text block mb-1.5"
                >
                  訪問日
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cafe-secondary pointer-events-none"
                    size={16}
                  />
                  <input
                    id="cafe-visit-date"
                    type="date"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl px-4 py-3 text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all select-none appearance-none"
                  />
                </div>
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="note">
          {(field) => (
            <div>
              <label htmlFor="cafe-note" className="text-xs font-bold text-cafe-text block mb-1.5">
                メモ / 味の感想
              </label>
              <div className="relative">
                <MessageSquare
                  className="absolute left-3.5 top-3.5 text-cafe-secondary/40"
                  size={16}
                />
                <textarea
                  id="cafe-note"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="味の特徴、豆の情報、お店の雰囲気など..."
                  rows={4}
                  className="w-full bg-cafe-background border border-cafe-secondary/20 rounded-xl pl-9 pr-4 py-3 text-sm text-cafe-text placeholder-cafe-secondary/40 focus:outline-none focus:ring-2 focus:ring-cafe-primary/10 focus:border-cafe-primary/60 transition-all resize-none"
                />
              </div>
            </div>
          )}
        </form.Field>

        <form.Field name="images">
          {(field) => (
            <ImagePicker
              images={field.state.value}
              onChange={field.handleChange}
              onError={setImageError}
              maxImages={maxImages}
            />
          )}
        </form.Field>
      </div>

      <div className={onCancel ? "flex space-x-4" : undefined}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${onCancel ? "flex-1" : "w-full"} bg-cafe-primary text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:bg-cafe-primary/95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span>{submitLabel}</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-white hover:bg-cafe-primary/5 border border-cafe-secondary/20 text-cafe-secondary font-semibold py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
