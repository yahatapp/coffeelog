import styles from "./forms.module.css";
import { getFirstValidationError } from "./formValidation";
import { Field, Select, Textarea } from "@yahatapp/ui";
import { Minus, Plus, Star } from "lucide-react";
import { Button, cn } from "../ui/button";
import { Input } from "../ui/input";
import "../ui/label";
import { Card } from "../ui/card";
import { Slider } from "../ui/slider";
import type { Bean, Dripper, Grinder } from "@/lib/queries";
import {
  durationOptions,
  getGrindLabel,
  makePour,
  optionsWithCurrent,
  waterAmountOptions,
  type LogFormValues,
} from "@/lib/form-values";
import type { LogFormApi } from "./types";
type BrewLogFieldsProps = {
  form: LogFormApi;
  beans: Bean[];
  drippers: Dripper[];
  grinders: Grinder[];
  isFetchingMasters?: boolean;
  navigate: (to: string) => void;
};
const parseNumber = (value: string, integer = false): number | "" => {
  if (value === "") return "";
  const parsed = integer ? Number.parseInt(value, 10) : Number.parseFloat(value);
  return Number.isNaN(parsed) ? "" : parsed;
};
const parsePourType = (value: string): "all" | "center_around" | "center_only" => {
  if (value === "center_around" || value === "center_only") return value;
  return "all";
};
const updatePour = (
  values: LogFormValues,
  index: number,
  update: Partial<LogFormValues["pours"][number]>,
): LogFormValues["pours"] =>
  values.pours.map((pour, pourIndex) =>
    pourIndex === index
      ? {
          ...pour,
          ...update,
        }
      : pour,
  );
export const BrewLogFields = ({
  form,
  beans,
  drippers,
  grinders,
  isFetchingMasters = false,
  navigate,
}: BrewLogFieldsProps) => (
  <form.Subscribe selector={(state) => state.values}>
    {(values) => {
      const selectedGrinder = grinders.find((grinder) => grinder.id === values.grinderId) ?? null;
      const minGrind = selectedGrinder
        ? Math.max(
            1,
            Math.min(
              values.grindSize || 1,
              selectedGrinder.fineMax - Math.ceil(selectedGrinder.fineMax * 0.2),
            ),
          )
        : 1;
      const maxGrind = selectedGrinder
        ? Math.max(values.grindSize || 1, Math.round(selectedGrinder.mediumCoarseMax * 1.2))
        : Math.max(values.grindSize || 1, 40);
      const grindMarks = Array.from(
        new Set([
          minGrind,
          (selectedGrinder?.fineMax ?? 6) + 1,
          (selectedGrinder?.mediumFineMax ?? 9) + 1,
          (selectedGrinder?.mediumMax ?? 15) + 1,
          (selectedGrinder?.mediumCoarseMax ?? 22) + 1,
        ]),
      )
        .filter((value) => value >= minGrind && value <= maxGrind)
        .map((value) => ({
          value,
          label: getGrindLabel(value, selectedGrinder).replace("挽き", ""),
        }));
      const setTempType = (tempType: "hot" | "ice") => {
        if (tempType === "ice") {
          form.setFieldValue("tempType", "ice");
          form.setFieldValue("iceAmount", values.iceAmount || 80);
          form.setFieldValue("yieldAmount", values.yieldAmount || 200);
          if (values.beanAmount === 10) form.setFieldValue("beanAmount", 16);
          if (values.waterAmount === 150) form.setFieldValue("waterAmount", 120);
        } else {
          form.setFieldValue("tempType", "hot");
          form.setFieldValue("iceAmount", "");
          form.setFieldValue("yieldAmount", values.waterAmount === 120 ? 150 : values.yieldAmount);
          if (values.beanAmount === 16) form.setFieldValue("beanAmount", 10);
          if (values.waterAmount === 120) form.setFieldValue("waterAmount", 150);
        }
      };
      const setPourCount = (count: number) => {
        const target = Math.max(0, Math.min(10, count));
        const next = values.pours.slice(0, target);
        for (let index = next.length; index < target; index += 1) {
          next.push(makePour(index));
        }
        form.setFieldValue("pours", next);
      };
      const setDrawdownPart = (part: "minutes" | "seconds", value: string) => {
        const current = values.drawdownTime === "" ? 0 : values.drawdownTime;
        const minutes = Math.floor(current / 60);
        const seconds = current % 60;
        const nextMinutes = part === "minutes" ? (value === "" ? 0 : Number(value)) : minutes;
        const nextSeconds = part === "seconds" ? (value === "" ? 0 : Number(value)) : seconds;
        form.setFieldValue(
          "drawdownTime",
          nextMinutes === 0 && nextSeconds === 0 ? "" : nextMinutes * 60 + nextSeconds,
        );
      };
      return (
        <Card>
          <div className={styles.content}>
            <div className={styles.field}>
              <Field id="bean" label={<>コーヒー豆</>} required>
                {(control) => (
                  <>
                    {isFetchingMasters ? (
                      <div className={styles.placeholder} />
                    ) : (
                      <form.Field name="beanId">
                        {(field) => (
                          <Select
                            {...control}
                            id="bean"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            required
                          >
                            <option value="" disabled>
                              豆を選択してください
                            </option>
                            {beans.map((bean) => (
                              <option key={bean.id} value={bean.id}>
                                {bean.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      </form.Field>
                    )}
                    {beans.length === 0 && !isFetchingMasters && (
                      <p className={styles.error}>
                        豆が登録されていません。{" "}
                        <button
                          type="button"
                          onClick={() => navigate("/beans/new")}
                          className={styles.textAction}
                        >
                          先に豆を登録してください。
                        </button>
                      </p>
                    )}
                  </>
                )}
              </Field>
            </div>

            <form.Field name="brewDate">
              {(field) => (
                <div className={styles.field}>
                  <Field
                    id="brewDate"
                    label={<>抽出日</>}
                    required
                    error={getFirstValidationError(field.state.meta.errors)}
                  >
                    {(control) => (
                      <>
                        <Input
                          {...control}
                          id="brewDate"
                          type="date"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                          required
                        />
                      </>
                    )}
                  </Field>
                </div>
              )}
            </form.Field>

            <div className={styles.field}>
              <Field id="dripper" label={<>ドリッパー</>} required>
                {(control) => (
                  <>
                    {isFetchingMasters ? (
                      <div className={styles.placeholder} />
                    ) : (
                      <form.Field name="dripperId">
                        {(field) => (
                          <Select
                            {...control}
                            id="dripper"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            required
                          >
                            <option value="" disabled>
                              ドリッパーを選択してください
                            </option>
                            {drippers.map((dripper) => (
                              <option key={dripper.id} value={dripper.id}>
                                {dripper.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      </form.Field>
                    )}
                    {drippers.length === 0 && !isFetchingMasters && (
                      <p className={styles.error}>
                        ドリッパーが登録されていません。{" "}
                        <button
                          type="button"
                          onClick={() => navigate("/settings/drippers")}
                          className={styles.textAction}
                        >
                          設定から登録してください
                        </button>
                      </p>
                    )}
                  </>
                )}
              </Field>
            </div>

            <div className={styles.field}>
              <Field id="grinder" label={<>グラインダー</>}>
                {(control) => (
                  <>
                    {isFetchingMasters ? (
                      <div className={styles.placeholder} />
                    ) : (
                      <form.Field name="grinderId">
                        {(field) => (
                          <Select
                            {...control}
                            id="grinder"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                          >
                            <option value="">選択してください</option>
                            {grinders.map((grinder) => (
                              <option key={grinder.id} value={grinder.id}>
                                {grinder.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      </form.Field>
                    )}
                  </>
                )}
              </Field>
            </div>

            <div className={styles.field}>
              <form.Field name="grindSize">
                {(field) => (
                  <Slider
                    id="grindSize"
                    label={
                      <>
                        挽き目 (クリック数:{" "}
                        <span className={styles.strong}>{field.state.value}</span>)
                      </>
                    }
                    valueDescription={getGrindLabel(field.state.value, selectedGrinder)}
                    min={minGrind}
                    max={maxGrind}
                    value={field.state.value}
                    marks={grindMarks}
                    onValueChange={field.handleChange}
                    onBlur={field.handleBlur}
                    getValueText={(value) =>
                      `${value}クリック (${getGrindLabel(value, selectedGrinder)})`
                    }
                  />
                )}
              </form.Field>
            </div>

            <div className={styles.field} role="group" aria-labelledby="brewlogfields-group-1">
              <span id="brewlogfields-group-1" className={styles.groupLabel}>
                抽出タイプ
              </span>
              <div className={styles.choices}>
                <button
                  type="button"
                  onClick={() => setTempType("hot")}
                  className={cn(
                    styles.choice,
                    values.tempType === "hot" ? styles.choiceHot : styles.muted,
                  )}
                  aria-pressed={values.tempType === "hot"}
                >
                  ☕ ホット
                </button>
                <button
                  type="button"
                  onClick={() => setTempType("ice")}
                  className={cn(
                    styles.choice,
                    values.tempType === "ice" ? styles.choiceIced : styles.muted,
                  )}
                  aria-pressed={values.tempType === "ice"}
                >
                  ❄️ アイス
                </button>
              </div>
            </div>

            {values.tempType === "ice" && (
              <form.Field name="iceAmount">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="iceAmt"
                      label={<>🧊 氷の量 (g)</>}
                      required
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="iceAmt"
                            type="number"
                            step="0.1"
                            value={field.state.value}
                            onChange={(event) =>
                              field.handleChange(parseNumber(event.target.value))
                            }
                            onBlur={field.handleBlur}
                            required
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
            )}

            <div className={styles.measurements}>
              <form.Field name="waterTemp">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="temp"
                      label={<>湯温 (℃)</>}
                      required
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="temp"
                            type="number"
                            value={field.state.value}
                            onChange={(event) =>
                              field.handleChange(parseNumber(event.target.value, true))
                            }
                            onBlur={field.handleBlur}
                            required
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
              <form.Field name="beanAmount">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="beanAmt"
                      label={<>豆量 (g)</>}
                      required
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="beanAmt"
                            type="number"
                            step="0.1"
                            value={field.state.value}
                            onChange={(event) =>
                              field.handleChange(parseNumber(event.target.value))
                            }
                            onBlur={field.handleBlur}
                            required
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
              <form.Field name="waterAmount">
                {(field) => (
                  <div className={styles.field}>
                    <Field
                      id="waterAmt"
                      label={<>注水量 (ml)</>}
                      required
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="waterAmt"
                            type="number"
                            value={field.state.value}
                            onChange={(event) => {
                              const parsed = parseNumber(event.target.value, true);
                              field.handleChange(parsed);
                              form.setFieldValue("yieldAmount", parsed);
                            }}
                            onBlur={field.handleBlur}
                            required
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
            </div>

            <div className={styles.field} role="group" aria-labelledby="brewlogfields-group-2">
              <span id="brewlogfields-group-2" className={styles.groupLabel}>
                評価
              </span>
              <div className={styles.rating}>
                <Button
                  type="button"
                  onClick={() => form.setFieldValue("rating", Math.max(1, values.rating - 0.5))}
                  disabled={values.rating <= 1}
                  aria-label="評価下げる"
                  variant="outline"
                  size="icon"
                >
                  <Minus size={18} aria-hidden={true} />
                </Button>
                <div className={styles.center}>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={22}
                        className={
                          star <= values.rating
                            ? styles.starFilled
                            : star - 0.5 <= values.rating
                              ? styles.starHalf
                              : styles.starEmpty
                        }
                        aria-hidden={true}
                      />
                    ))}
                  </div>
                  <span className={styles.ratingValue}>
                    {values.rating.toFixed(1)}
                    <small className={styles.helper}> / 5.0</small>
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => form.setFieldValue("rating", Math.min(5, values.rating + 0.5))}
                  disabled={values.rating >= 5}
                  aria-label="評価上げる"
                  variant="outline"
                  size="icon"
                >
                  <Plus size={18} aria-hidden={true} />
                </Button>
              </div>
            </div>

            <div className={styles.divider}>
              <div className={styles.panel} role="group" aria-labelledby="brewlogfields-group-3">
                <span id="brewlogfields-group-3" className={styles.groupLabel}>
                  注ぎ回数 (投)
                </span>
                <div className={styles.row}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPourCount(values.pours.length - 1)}
                    disabled={values.pours.length <= 0}
                    aria-label="注ぎ回数を減らす"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={values.pours.length}
                    onChange={(event) => setPourCount(Number.parseInt(event.target.value, 10) || 0)}
                    aria-label="注ぎ回数 (投)"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPourCount(values.pours.length + 1)}
                    disabled={values.pours.length >= 10}
                    aria-label="注ぎ回数を増やす"
                  >
                    +
                  </Button>
                </div>
              </div>
              <form.Field name="pours" mode="array">
                {(field) =>
                  values.pours.length === 0 ? (
                    <p className={styles.hint}>
                      投数を増やすと、ここに注ぎ方の詳細入力欄が表示されます。
                    </p>
                  ) : (
                    <div className={styles.panel}>
                      <div className={styles.pourHeader}>
                        <span className={styles.stepTitle}>ステップ</span>
                        <span className={styles.cellTitle}>注水量</span>
                        <span className={styles.cellTitle}>時間</span>
                        <span className={styles.cellTitle}>注ぎ方</span>
                      </div>
                      {field.state.value.map((pour, index) => (
                        <div key={`${pour.pourNumber}-${index}`} className={styles.pourRow}>
                          <span className={styles.step}>{pour.pourNumber}投目</span>
                          <Field id={`pour-${index}-amount`} label="注水量 (ml)" required>
                            {(control) => (
                              <Select
                                {...control}
                                value={pour.waterAmount}
                                onChange={(event) =>
                                  field.handleChange(
                                    updatePour(values, index, {
                                      waterAmount: Number(event.target.value),
                                    }),
                                  )
                                }
                                required
                              >
                                {optionsWithCurrent(waterAmountOptions, pour.waterAmount).map(
                                  (amount) => (
                                    <option key={amount} value={amount}>
                                      {amount}
                                    </option>
                                  ),
                                )}
                              </Select>
                            )}
                          </Field>
                          {index === values.pours.length - 1 ? (
                            <Field id={`pour-${index}-duration`} label="時間 (秒)">
                              {(control) => (
                                <Select {...control} disabled value="">
                                  <option value="">不要</option>
                                </Select>
                              )}
                            </Field>
                          ) : (
                            <Field id={`pour-${index}-duration`} label="時間 (秒)" required>
                              {(control) => (
                                <Select
                                  {...control}
                                  value={pour.duration}
                                  onChange={(event) => {
                                    const duration = Number(event.target.value);
                                    field.handleChange(
                                      updatePour(values, index, {
                                        duration,
                                      }),
                                    );
                                  }}
                                  required
                                >
                                  {optionsWithCurrent(durationOptions, pour.duration).map(
                                    (duration) => (
                                      <option key={duration} value={duration}>
                                        {duration}
                                      </option>
                                    ),
                                  )}
                                </Select>
                              )}
                            </Field>
                          )}
                          <div className={styles.pourMode}>
                            <Field id={`pour-${index}-mode`} label="注ぎ方">
                              {(control) => (
                                <Select
                                  {...control}
                                  value={pour.pourType}
                                  onChange={(event) =>
                                    field.handleChange(
                                      updatePour(values, index, {
                                        pourType: parsePourType(event.target.value),
                                      }),
                                    )
                                  }
                                >
                                  <option value="all">全体に</option>
                                  <option value="center_around">中心付近</option>
                                  <option value="center_only">中心のみ</option>
                                </Select>
                              )}
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </form.Field>
              <div className={styles.divider}>
                <div className={styles.spread} role="group" aria-labelledby="brewlogfields-group-4">
                  <span id="brewlogfields-group-4" className={styles.groupLabel}>
                    落ち切り時間
                  </span>
                  <span className={styles.helper}>※注ぎ始めからドリッパーを外すまで</span>
                </div>
                <div className={styles.row}>
                  <div className={styles.growRow}>
                    <Select
                      value={values.drawdownTime === "" ? "" : Math.floor(values.drawdownTime / 60)}
                      onChange={(event) => setDrawdownPart("minutes", event.target.value)}
                      aria-label="落ち切り時間 (分)"
                    >
                      <option value="">-</option>
                      {[0, 1, 2, 3, 4, 5].map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </Select>
                    <span className={styles.text}>分</span>
                  </div>
                  <div className={styles.growRow}>
                    <Select
                      value={values.drawdownTime === "" ? "" : values.drawdownTime % 60}
                      onChange={(event) => setDrawdownPart("seconds", event.target.value)}
                      aria-label="落ち切り時間 (秒)"
                    >
                      <option value="">-</option>
                      {Array.from(
                        {
                          length: 12,
                        },
                        (_, index) => index * 5,
                      ).map((second) => (
                        <option key={second} value={second}>
                          {second}
                        </option>
                      ))}
                    </Select>
                    <span className={styles.text}>秒</span>
                  </div>
                </div>
              </div>
              <form.Field name="yieldAmount">
                {(field) => (
                  <div className={styles.divider}>
                    <Field
                      id="yieldAmt"
                      label={<>{values.tempType === "ice" ? "🥛 " : ""}仕上がり量 (ml)</>}
                      required
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Input
                            {...control}
                            id="yieldAmt"
                            type="number"
                            value={field.state.value}
                            onChange={(event) =>
                              field.handleChange(parseNumber(event.target.value, true))
                            }
                            onBlur={field.handleBlur}
                            placeholder={
                              values.waterAmount ? String(values.waterAmount) : "例: 150"
                            }
                            required
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
              <div className={styles.divider} role="group" aria-labelledby="brewlogfields-group-5">
                <span id="brewlogfields-group-5" className={styles.groupLabel}>
                  加水
                </span>
                <div className={styles.choices}>
                  <button
                    type="button"
                    onClick={() => form.setFieldValue("hasBypass", false)}
                    className={cn(
                      styles.choice,
                      !values.hasBypass ? styles.choiceActive : styles.muted,
                    )}
                    aria-pressed={!values.hasBypass}
                  >
                    なし
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setFieldValue("hasBypass", true)}
                    className={cn(
                      styles.choice,
                      values.hasBypass ? styles.choiceActive : styles.muted,
                    )}
                    aria-pressed={values.hasBypass}
                  >
                    あり
                  </button>
                </div>
              </div>
              <form.Field name="brewComment">
                {(field) => (
                  <div className={styles.divider}>
                    <Field
                      id="brewComment"
                      label={<>抽出コメント</>}
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Textarea
                            {...control}
                            id="brewComment"
                            rows={3}
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="ステアや温度調整など..."
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
              <form.Field name="note">
                {(field) => (
                  <div className={styles.divider}>
                    <Field
                      id="note"
                      label={<>テイスティングノート</>}
                      error={getFirstValidationError(field.state.meta.errors)}
                    >
                      {(control) => (
                        <>
                          <Textarea
                            {...control}
                            id="note"
                            rows={3}
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="味の感想など..."
                          />
                        </>
                      )}
                    </Field>
                  </div>
                )}
              </form.Field>
            </div>
          </div>
        </Card>
      );
    }}
  </form.Subscribe>
);
