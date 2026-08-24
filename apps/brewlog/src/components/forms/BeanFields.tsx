import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { COFFEE_COUNTRIES } from "@/utils/flag";
import { getRoastLabel, PROCESS_METHODS } from "@/lib/form-values";
import type { BeanFormApi } from "./types";

type BeanFieldsProps = {
  form: BeanFormApi;
  isVersionMode: boolean;
};

export const BeanFields = ({ form, isVersionMode }: BeanFieldsProps) => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <form.Field name="name">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="name">豆の名前</Label>
            <Input
              id="name"
              placeholder="例: エチオピア イルガチェフェ"
              required
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="rounded-xl border-coffee-secondary/20 focus:ring-coffee-primary"
              disabled={isVersionMode}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="origin">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="origin">産地</Label>
            <Input
              id="origin"
              list="origins"
              placeholder="例: エチオピア (候補から選択も可能)"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="rounded-xl border-coffee-secondary/20"
              disabled={isVersionMode}
            />
            <datalist id="origins">
              {COFFEE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.name} />
              ))}
            </datalist>
          </div>
        )}
      </form.Field>

      <form.Field name="purchaseStore">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="purchaseStore">購入店</Label>
            <Input
              id="purchaseStore"
              placeholder="例: ブルーボトルコーヒー"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="rounded-xl border-coffee-secondary/20"
              disabled={isVersionMode}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="processMethod">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="processMethod">精製方法</Label>
            <select
              id="processMethod"
              className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all text-coffee-text"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              disabled={isVersionMode}
            >
              <option value="">選択してください (任意)</option>
              {PROCESS_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </form.Field>

      <form.Field name="roastLevel">
        {(field) => (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="roast">焙煎度</Label>
              <span className="text-sm font-bold text-coffee-primary">
                {getRoastLabel(field.state.value)}
              </span>
            </div>
            <div className="px-1">
              <input
                type="range"
                id="roast"
                min="1"
                max="5"
                step="1"
                className="w-full h-2 bg-coffee-secondary/20 rounded-lg appearance-none cursor-pointer accent-coffee-primary disabled:opacity-50"
                value={field.state.value}
                onChange={(event) => field.handleChange(Number(event.target.value))}
                onBlur={field.handleBlur}
                disabled={isVersionMode}
              />
              <div className="flex justify-between mt-2 text-[10px] text-coffee-secondary">
                <span>浅煎り</span>
                <span>中煎り</span>
                <span>深煎り</span>
              </div>
            </div>
          </div>
        )}
      </form.Field>

      {isVersionMode && (
        <form.Field name="version">
          {(field) => (
            <div className="space-y-2 pt-4 border-t border-coffee-secondary/10">
              <Label htmlFor="version">バージョン名</Label>
              <Input
                id="version"
                required
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                className="rounded-xl border-coffee-secondary/20 focus:ring-coffee-primary"
              />
            </div>
          )}
        </form.Field>
      )}

      <form.Field name="roastDate">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="roastDate">焙煎日</Label>
            <Input
              id="roastDate"
              type="date"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="rounded-xl border-coffee-secondary/20 focus:ring-coffee-primary"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="purchaseDate">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="date">購入日</Label>
            <Input
              id="date"
              type="date"
              value={field.state.value}
              onChange={(event) => {
                const nextDate = event.target.value;
                const shouldSyncVersion =
                  isVersionMode &&
                  form.getFieldValue("version") === field.state.value.replace(/-/g, ".");

                field.handleChange(nextDate);

                if (shouldSyncVersion) {
                  form.setFieldValue("version", nextDate.replace(/-/g, "."));
                }
              }}
              onBlur={field.handleBlur}
              className="rounded-xl border-coffee-secondary/20 focus:ring-coffee-primary"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="note">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="note">メモ</Label>
            <textarea
              id="note"
              rows={4}
              placeholder="豆の特徴や購入時の情報などを自由に記録できます"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="flex min-h-24 w-full resize-y rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm text-coffee-text ring-offset-white transition-all placeholder:text-coffee-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary focus-visible:ring-offset-2"
            />
          </div>
        )}
      </form.Field>

      {!isVersionMode && (
        <form.Field name="isArchived">
          {(field) => (
            <div className="flex items-center space-x-2 pt-2">
              <input
                id="archive"
                type="checkbox"
                checked={field.state.value}
                onChange={(event) => field.handleChange(event.target.checked)}
                className="h-4 w-4 rounded border-coffee-secondary/35 text-coffee-primary focus:ring-coffee-primary focus:ring-offset-0"
              />
              <Label
                htmlFor="archive"
                className="text-sm font-medium cursor-pointer text-coffee-text"
              >
                この豆をアーカイブする (一覧に表示されなくなります)
              </Label>
            </div>
          )}
        </form.Field>
      )}
    </CardContent>
  </Card>
);
