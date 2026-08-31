import { Minus, Plus, Star } from "lucide-react";
import { Button, cn } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
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
  values.pours.map((pour, pourIndex) => (pourIndex === index ? { ...pour, ...update } : pour));

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
      const grindMarks = [
        { value: 1, label: "1 (細)" },
        { value: (selectedGrinder?.fineMax ?? 6) + 1, label: "中細" },
        { value: (selectedGrinder?.mediumFineMax ?? 9) + 1, label: "中" },
        { value: (selectedGrinder?.mediumMax ?? 15) + 1, label: "中粗" },
        { value: (selectedGrinder?.mediumCoarseMax ?? 22) + 1, label: "粗" },
      ].filter((mark) => mark.value >= minGrind && mark.value <= maxGrind);
      if (grindMarks.length === 0) grindMarks.push({ value: minGrind, label: String(minGrind) });

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
          next.push(makePour(index, values.bloomingTime));
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
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bean">コーヒー豆</Label>
              {isFetchingMasters ? (
                <div className="h-10 w-full animate-pulse bg-coffee-secondary/10 rounded-xl" />
              ) : (
                <form.Field name="beanId">
                  {(field) => (
                    <select
                      id="bean"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      required
                      className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm"
                    >
                      <option value="" disabled>
                        豆を選択してください
                      </option>
                      {beans.map((bean) => (
                        <option key={bean.id} value={bean.id}>
                          {bean.name}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              )}
              {beans.length === 0 && !isFetchingMasters && (
                <p className="text-[10px] text-red-500">
                  豆が登録されていません。{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/beans/new")}
                    className="underline font-bold"
                  >
                    先に豆を登録してください。
                  </button>
                </p>
              )}
            </div>

            <form.Field name="brewDate">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="brewDate">抽出日</Label>
                  <Input
                    id="brewDate"
                    type="date"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className="rounded-xl border-coffee-secondary/20"
                    required
                  />
                </div>
              )}
            </form.Field>

            <div className="space-y-2">
              <Label htmlFor="dripper">ドリッパー</Label>
              {isFetchingMasters ? (
                <div className="h-10 w-full animate-pulse bg-coffee-secondary/10 rounded-xl" />
              ) : (
                <form.Field name="dripperId">
                  {(field) => (
                    <select
                      id="dripper"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      required
                      className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm"
                    >
                      <option value="" disabled>
                        ドリッパーを選択してください
                      </option>
                      {drippers.map((dripper) => (
                        <option key={dripper.id} value={dripper.id}>
                          {dripper.name}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              )}
              {drippers.length === 0 && !isFetchingMasters && (
                <p className="text-[10px] text-red-500">
                  ドリッパーが登録されていません。{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/settings/drippers")}
                    className="underline font-bold"
                  >
                    設定から登録してください
                  </button>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grinder">グラインダー</Label>
              {isFetchingMasters ? (
                <div className="h-10 w-full animate-pulse bg-coffee-secondary/10 rounded-xl" />
              ) : (
                <form.Field name="grinderId">
                  {(field) => (
                    <select
                      id="grinder"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">選択してください</option>
                      {grinders.map((grinder) => (
                        <option key={grinder.id} value={grinder.id}>
                          {grinder.name}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="grindSize">
                  挽き目 (クリック数:{" "}
                  <span className="font-bold text-coffee-primary">{values.grindSize}</span>)
                </Label>
                <span className="text-sm font-bold bg-coffee-primary/10 text-coffee-primary px-3 py-0.5 rounded-full">
                  {getGrindLabel(values.grindSize, selectedGrinder)}
                </span>
              </div>
              <form.Field name="grindSize">
                {(field) => (
                  <input
                    type="range"
                    id="grindSize"
                    min={minGrind}
                    max={maxGrind}
                    step="1"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(Number(event.target.value))}
                    onBlur={field.handleBlur}
                    className="w-full h-2 bg-coffee-secondary/20 rounded-lg appearance-none cursor-pointer accent-coffee-primary"
                  />
                )}
              </form.Field>
              <div className="flex justify-between text-[10px] text-coffee-secondary">
                {grindMarks.map((mark) => (
                  <span key={mark.value}>
                    {mark.value} ({mark.label})
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Label>抽出タイプ</Label>
              <div className="grid grid-cols-2 gap-2 bg-coffee-secondary/10 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTempType("hot")}
                  className={cn(
                    "py-2 px-4 rounded-xl text-sm font-bold",
                    values.tempType === "hot"
                      ? "bg-white text-orange-700 shadow-sm"
                      : "text-coffee-secondary",
                  )}
                >
                  ☕ ホット
                </button>
                <button
                  type="button"
                  onClick={() => setTempType("ice")}
                  className={cn(
                    "py-2 px-4 rounded-xl text-sm font-bold",
                    values.tempType === "ice"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-coffee-secondary",
                  )}
                >
                  ❄️ アイス
                </button>
              </div>
            </div>

            {values.tempType === "ice" && (
              <form.Field name="iceAmount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="iceAmt" className="text-blue-700">
                      🧊 氷の量 (g)
                    </Label>
                    <Input
                      id="iceAmt"
                      type="number"
                      step="0.1"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(parseNumber(event.target.value))}
                      onBlur={field.handleBlur}
                      className="rounded-xl border-blue-200"
                      required
                    />
                  </div>
                )}
              </form.Field>
            )}

            <div className="grid grid-cols-3 gap-4 pt-1">
              <form.Field name="waterTemp">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="temp">湯温 (℃)</Label>
                    <Input
                      id="temp"
                      type="number"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(parseNumber(event.target.value, true))
                      }
                      onBlur={field.handleBlur}
                      className="rounded-xl border-coffee-secondary/20"
                      required
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="beanAmount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="beanAmt">豆量 (g)</Label>
                    <Input
                      id="beanAmt"
                      type="number"
                      step="0.1"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(parseNumber(event.target.value))}
                      onBlur={field.handleBlur}
                      className="rounded-xl border-coffee-secondary/20"
                      required
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="waterAmount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="waterAmt">注水量 (ml)</Label>
                    <Input
                      id="waterAmt"
                      type="number"
                      value={field.state.value}
                      onChange={(event) => {
                        const parsed = parseNumber(event.target.value, true);
                        field.handleChange(parsed);
                        form.setFieldValue("yieldAmount", parsed);
                      }}
                      onBlur={field.handleBlur}
                      className="rounded-xl border-coffee-secondary/20"
                      required
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="space-y-2 pt-1">
              <Label>評価</Label>
              <div className="flex items-center justify-between bg-coffee-secondary/5 border border-coffee-secondary/10 p-3.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => form.setFieldValue("rating", Math.max(1, values.rating - 0.5))}
                  disabled={values.rating <= 1}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-coffee-secondary/20 text-coffee-primary disabled:opacity-40"
                  aria-label="評価下げる"
                >
                  <Minus size={18} />
                </button>
                <div className="flex flex-col items-center">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={22}
                        className={
                          star <= values.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : star - 0.5 <= values.rating
                              ? "fill-yellow-200 text-yellow-400"
                              : "text-coffee-secondary/20"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xl font-extrabold text-coffee-primary">
                    {values.rating.toFixed(1)}
                    <small className="text-[10px] text-coffee-secondary"> / 5.0</small>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => form.setFieldValue("rating", Math.min(5, values.rating + 0.5))}
                  disabled={values.rating >= 5}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-coffee-secondary/20 text-coffee-primary disabled:opacity-40"
                  aria-label="評価上げる"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-coffee-secondary/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-coffee-secondary/5 border border-coffee-secondary/10 space-y-2">
                  <Label className="text-xs font-bold text-coffee-primary">注ぎ回数 (投)</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPourCount(values.pours.length - 1)}
                      disabled={values.pours.length <= 0}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={values.pours.length}
                      onChange={(event) =>
                        setPourCount(Number.parseInt(event.target.value, 10) || 0)
                      }
                      className="h-8 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPourCount(values.pours.length + 1)}
                      disabled={values.pours.length >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <form.Field name="bloomingTime">
                  {(field) => (
                    <div className="p-3 rounded-2xl bg-coffee-secondary/5 border border-coffee-secondary/10 space-y-2">
                      <Label
                        htmlFor="bloomingTime"
                        className="text-xs font-bold text-coffee-primary"
                      >
                        蒸らし時間 (秒)
                      </Label>
                      <Input
                        id="bloomingTime"
                        type="number"
                        value={field.state.value}
                        onChange={(event) => {
                          const value = parseNumber(event.target.value, true);
                          field.handleChange(value);
                          if (values.pours.length > 0)
                            form.setFieldValue(
                              "pours",
                              updatePour(values, 0, { duration: value === "" ? 0 : value }),
                            );
                        }}
                        className="h-8 text-center"
                      />
                    </div>
                  )}
                </form.Field>
              </div>
              <form.Field name="pours" mode="array">
                {(field) =>
                  values.pours.length === 0 ? (
                    <p className="text-xs text-coffee-secondary italic text-center py-4 bg-coffee-secondary/5 rounded-2xl">
                      投数を増やすと、ここに注ぎ方の詳細入力欄が表示されます。
                    </p>
                  ) : (
                    <div className="space-y-2 border border-coffee-secondary/10 p-3 rounded-2xl">
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-coffee-secondary px-1 border-b pb-1">
                        <span className="w-12 text-center">ステップ</span>
                        <span className="flex-1 text-center">注水量</span>
                        <span className="flex-1 text-center">時間</span>
                        <span className="w-20 text-center">注ぎ方</span>
                      </div>
                      {field.state.value.map((pour, index) => (
                        <div
                          key={`${pour.pourNumber}-${index}`}
                          className="flex items-center space-x-2 pt-2"
                        >
                          <span className="w-12 text-[10px] font-black text-coffee-primary text-center bg-coffee-primary/10 py-1.5 rounded-lg">
                            {pour.pourNumber}投目
                          </span>
                          <select
                            value={pour.waterAmount}
                            onChange={(event) =>
                              field.handleChange(
                                updatePour(values, index, {
                                  waterAmount: Number(event.target.value),
                                }),
                              )
                            }
                            className="h-8 flex-1 rounded-lg border border-coffee-secondary/20 bg-white px-1 text-xs text-center"
                            required
                          >
                            {optionsWithCurrent(waterAmountOptions, pour.waterAmount).map(
                              (amount) => (
                                <option key={amount} value={amount}>
                                  {amount}
                                </option>
                              ),
                            )}
                          </select>
                          {index === values.pours.length - 1 ? (
                            <select
                              disabled
                              value=""
                              className="h-8 flex-1 rounded-lg border border-coffee-secondary/20 bg-coffee-secondary/5 px-1 text-xs text-center"
                            >
                              <option value="">不要</option>
                            </select>
                          ) : (
                            <select
                              value={pour.duration}
                              onChange={(event) => {
                                const duration = Number(event.target.value);
                                field.handleChange(
                                  updatePour(values, index, {
                                    duration,
                                  }),
                                );
                                if (index === 0) form.setFieldValue("bloomingTime", duration);
                              }}
                              className="h-8 flex-1 rounded-lg border border-coffee-secondary/20 bg-white px-1 text-xs text-center"
                              required
                            >
                              {optionsWithCurrent(durationOptions, pour.duration).map(
                                (duration) => (
                                  <option key={duration} value={duration}>
                                    {duration}
                                  </option>
                                ),
                              )}
                            </select>
                          )}
                          <select
                            value={pour.pourType}
                            onChange={(event) =>
                              field.handleChange(
                                updatePour(values, index, {
                                  pourType: parsePourType(event.target.value),
                                }),
                              )
                            }
                            className="h-8 w-20 rounded-lg border border-coffee-secondary/20 bg-white px-1 text-xs text-center"
                          >
                            <option value="all">全体に</option>
                            <option value="center_around">中心付近</option>
                            <option value="center_only">中心のみ</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )
                }
              </form.Field>
              <div className="space-y-2 pt-2 border-t border-coffee-secondary/5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-coffee-secondary">落ち切り時間</Label>
                  <span className="text-[9px] text-coffee-secondary">
                    ※注ぎ始めからドリッパーを外すまで
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <select
                      value={values.drawdownTime === "" ? "" : Math.floor(values.drawdownTime / 60)}
                      onChange={(event) => setDrawdownPart("minutes", event.target.value)}
                      className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">-</option>
                      {[0, 1, 2, 3, 4, 5].map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm">分</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <select
                      value={values.drawdownTime === "" ? "" : values.drawdownTime % 60}
                      onChange={(event) => setDrawdownPart("seconds", event.target.value)}
                      className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">-</option>
                      {Array.from({ length: 12 }, (_, index) => index * 5).map((second) => (
                        <option key={second} value={second}>
                          {second}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm">秒</span>
                  </div>
                </div>
              </div>
              <form.Field name="yieldAmount">
                {(field) => (
                  <div className="space-y-2 pt-2 border-t border-coffee-secondary/5">
                    <Label
                      htmlFor="yieldAmt"
                      className={
                        values.tempType === "ice" ? "text-blue-700" : "text-coffee-secondary"
                      }
                    >
                      {values.tempType === "ice" ? "🥛 " : ""}仕上がり量 (ml)
                    </Label>
                    <Input
                      id="yieldAmt"
                      type="number"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(parseNumber(event.target.value, true))
                      }
                      onBlur={field.handleBlur}
                      placeholder={values.waterAmount ? String(values.waterAmount) : "例: 150"}
                      className="rounded-xl"
                      required
                    />
                  </div>
                )}
              </form.Field>
              <div className="space-y-2 pt-2 border-t border-coffee-secondary/5">
                <Label>加水</Label>
                <div className="grid grid-cols-2 gap-2 bg-coffee-secondary/10 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => form.setFieldValue("hasBypass", false)}
                    className={cn(
                      "py-2 px-4 rounded-xl text-sm font-bold",
                      !values.hasBypass
                        ? "bg-white text-coffee-primary shadow-sm"
                        : "text-coffee-secondary",
                    )}
                  >
                    なし
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setFieldValue("hasBypass", true)}
                    className={cn(
                      "py-2 px-4 rounded-xl text-sm font-bold",
                      values.hasBypass
                        ? "bg-white text-coffee-primary shadow-sm"
                        : "text-coffee-secondary",
                    )}
                  >
                    あり
                  </button>
                </div>
              </div>
              <form.Field name="note">
                {(field) => (
                  <div className="space-y-2 pt-2 border-t border-coffee-secondary/5">
                    <Label htmlFor="note">テイスティングノート</Label>
                    <textarea
                      id="note"
                      rows={3}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      className="flex w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm"
                      placeholder="味の感想など..."
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>
      );
    }}
  </form.Subscribe>
);
