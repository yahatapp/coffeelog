import styles from "./forms.module.css";
import { Slider } from "../ui/slider";
import { getFirstValidationError } from "./formValidation";
import { Field, Select, Textarea, Checkbox } from "@yahatapp/ui";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Segment } from "../ui/segment";
import { COFFEE_COUNTRIES } from "@/utils/flag";
import { getRoastLabel, PROCESS_METHODS } from "@/lib/form-values";
import type { BeanFormApi } from "./types";
import { BeanStoreFields } from "./BeanStoreFields";
type BeanFieldsProps = {
  form: BeanFormApi;
  isVersionMode: boolean;
};
const coffeeTypeOptions = [
  {
    label: "レギュラーコーヒー",
    value: "regular",
  },
  {
    label: "スペシャルティコーヒー",
    value: "specialty",
  },
] as const;
export const BeanFields = ({ form, isVersionMode }: BeanFieldsProps) => (
  <Card>
    <div className={styles.content}>
      <form.Field name="coffeeType">
        {(field) => (
          <div className={styles.field} role="group" aria-labelledby="beanfields-group-1">
            <span id="beanfields-group-1" className={styles.groupLabel}>
              コーヒーの種類
            </span>
            <Segment
              ariaLabel="コーヒーの種類"
              value={field.state.value}
              onValueChange={field.handleChange}
              options={coffeeTypeOptions}
              disabled={isVersionMode}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="name">
        {(field) => (
          <div className={styles.field}>
            <Field
              id="name"
              label={<>豆の名前</>}
              required
              error={getFirstValidationError(field.state.meta.errors)}
            >
              {(control) => (
                <>
                  <Input
                    {...control}
                    id="name"
                    placeholder="例: エチオピア イルガチェフェ"
                    required
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isVersionMode}
                  />
                </>
              )}
            </Field>
          </div>
        )}
      </form.Field>

      <form.Field name="origin">
        {(field) => (
          <div className={styles.field}>
            <Field
              id="origin"
              label={<>産地</>}
              error={getFirstValidationError(field.state.meta.errors)}
            >
              {(control) => (
                <>
                  <Input
                    {...control}
                    id="origin"
                    list="origins"
                    placeholder="例: エチオピア (候補から選択も可能)"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isVersionMode}
                  />
                  <datalist id="origins">
                    {COFFEE_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.name} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.coffeeType}>
        {(coffeeType) =>
          coffeeType === "specialty" ? (
            <div className={styles.panel}>
              <div>
                <h3 className={styles.heading}>生産情報</h3>
                <p className={styles.helperSpaced}>
                  スペシャルティコーヒーの詳しい属性を記録できます。
                </p>
              </div>

              <form.Field name="region">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="region"
                      label={<>地域</>}
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="region"
                            placeholder="例: シダマ"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            disabled={isVersionMode}
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>

              <form.Field name="variety">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="variety"
                      label={<>品種</>}
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="variety"
                            placeholder="例: ゲイシャ"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            disabled={isVersionMode}
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>

              <form.Field name="farm">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="farm"
                      label={<>農園</>}
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="farm"
                            placeholder="例: コピア農園"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            disabled={isVersionMode}
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>

              <form.Field name="producer">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="producer"
                      label={<>生産者</>}
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="producer"
                            placeholder="例: ホセ・ヒラルド"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            disabled={isVersionMode}
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
            </div>
          ) : null
        }
      </form.Subscribe>

      <form.Subscribe selector={(state) => state.values.coffeeType}>
        {(coffeeType) =>
          coffeeType === "specialty" ? (
            <BeanStoreFields form={form} disabled={isVersionMode} />
          ) : (
            <form.Field name="purchaseStore">
              {(field) => (
                <div className={styles.field}>
                  <Field
                    id="purchaseStore"
                    label={<>購入店</>}
                    error={getFirstValidationError(field.state.meta.errors)}
                  >
                    {(control) => (
                      <>
                        <Input
                          {...control}
                          id="purchaseStore"
                          placeholder="例: ブルーボトルコーヒー"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                          disabled={isVersionMode}
                        />
                      </>
                    )}
                  </Field>
                </div>
              )}
            </form.Field>
          )
        }
      </form.Subscribe>

      <form.Field name="processMethod">
        {(field) => (
          <div className={styles.field}>
            <Field
              id="processMethod"
              label={<>精製方法</>}
              error={getFirstValidationError(field.state.meta.errors)}
            >
              {(control) => (
                <>
                  <Select
                    {...control}
                    id="processMethod"
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
                  </Select>
                </>
              )}
            </Field>
          </div>
        )}
      </form.Field>

      <form.Field name="roastLevel">
        {(field) => (
          <Slider
            id="roast"
            label="焙煎度"
            valueDescription={getRoastLabel(field.state.value)}
            min={1}
            max={5}
            value={field.state.value}
            marks={[
              {
                value: 1,
                label: "浅煎り",
              },
              {
                value: 3,
                label: "中煎り",
              },
              {
                value: 5,
                label: "深煎り",
              },
            ]}
            disabled={isVersionMode}
            onValueChange={field.handleChange}
            onBlur={field.handleBlur}
            getValueText={getRoastLabel}
          />
        )}
      </form.Field>

      {isVersionMode && (
        <form.Field name="version">
          {(field) => (
            <div className={styles.divider}>
              <Field
                id="version"
                label={<>バージョン名</>}
                required
                error={getFirstValidationError(field.state.meta.errors)}
              >
                {(control) => (
                  <>
                    <Input
                      {...control}
                      id="version"
                      required
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </>
                )}
              </Field>
            </div>
          )}
        </form.Field>
      )}

      <form.Field name="roastDate">
        {(field) => (
          <div className={styles.field}>
            <Field
              id="roastDate"
              label={<>焙煎日</>}
              error={getFirstValidationError(field.state.meta.errors)}
            >
              {(control) => (
                <>
                  <Input
                    {...control}
                    id="roastDate"
                    type="date"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </>
              )}
            </Field>
          </div>
        )}
      </form.Field>

      <form.Field name="purchaseDate">
        {(field) => (
          <div className={styles.field}>
            <Field
              id="date"
              label={<>購入日</>}
              error={getFirstValidationError(field.state.meta.errors)}
            >
              {(control) => (
                <>
                  <Input
                    {...control}
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
                  />
                </>
              )}
            </Field>
          </div>
        )}
      </form.Field>

      <form.Field name="note">
        {(field) => (
          <div className={styles.field}>
            <Field
              id="note"
              label={<>メモ</>}
              error={getFirstValidationError(field.state.meta.errors)}
            >
              {(control) => (
                <>
                  <Textarea
                    {...control}
                    id="note"
                    rows={4}
                    placeholder="豆の特徴や購入時の情報などを自由に記録できます"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </>
              )}
            </Field>
          </div>
        )}
      </form.Field>

      {!isVersionMode && (
        <form.Field name="isArchived">
          {(field) => (
            <div className={styles.row}>
              <Checkbox
                id="archive"
                type="checkbox"
                checked={field.state.value}
                onChange={(event) => field.handleChange(event.target.checked)}
              />
              <Label htmlFor="archive">この豆をアーカイブする (一覧に表示されなくなります)</Label>
            </div>
          )}
        </form.Field>
      )}
    </div>
  </Card>
);
