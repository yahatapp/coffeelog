import type {
  BeanCreateInput,
  BeanUpdateInput,
  CoffeeType,
  LogCreateInput,
  LogUpdateInput,
} from "@/contracts";
import { BREWLOG_PROCESS_METHODS, getRoastLabel } from "@yahatapp/coffee-reference";

export const PROCESS_METHODS = BREWLOG_PROCESS_METHODS;

export type BeanFormValues = {
  name: string;
  coffeeType: CoffeeType;
  origin: string;
  purchaseStore: string;
  roastLevel: number;
  roastDate: string;
  purchaseDate: string;
  processMethod: string;
  note: string;
  version: string;
  isArchived: boolean;
};

export const toBeanCreateInput = (
  values: BeanFormValues,
  parentBeanId: string | null,
): BeanCreateInput => ({
  name: values.name.trim(),
  coffeeType: values.coffeeType,
  origin: values.origin.trim() || null,
  purchaseStore: values.purchaseStore.trim() || null,
  roastLevel: values.roastLevel,
  roastDate: values.roastDate || null,
  purchaseDate: values.purchaseDate || null,
  imageUrl: null,
  processMethod: values.processMethod || null,
  note: values.note.trim() || null,
  parentBeanId,
  version: values.version.trim() || null,
});

export const toBeanUpdateInput = (values: BeanFormValues): BeanUpdateInput => ({
  name: values.name.trim(),
  coffeeType: values.coffeeType,
  origin: values.origin.trim() || null,
  purchaseStore: values.purchaseStore.trim() || null,
  roastLevel: values.roastLevel,
  roastDate: values.roastDate || null,
  purchaseDate: values.purchaseDate || null,
  isArchived: values.isArchived,
  processMethod: values.processMethod || null,
  note: values.note.trim() || null,
});

export type PourFormValue = {
  pourNumber: number;
  waterAmount: number;
  duration: number;
  pourType: "all" | "center_around" | "center_only";
};

export type LogFormValues = {
  beanId: string;
  brewDate: string;
  dripperId: string;
  grinderId: string;
  grindSize: number;
  waterTemp: number | "";
  beanAmount: number | "";
  waterAmount: number | "";
  rating: number;
  note: string;
  tempType: "hot" | "ice";
  iceAmount: number | "";
  yieldAmount: number | "";
  drawdownTime: number | "";
  bloomingTime: number | "";
  hasBypass: boolean;
  pours: PourFormValue[];
};

const numberOrNull = (value: number | ""): number | null => (value === "" ? null : value);

export const toLogCreateInput = (values: LogFormValues): LogCreateInput => ({
  beanId: values.beanId,
  method: null,
  grindSize: values.grindSize,
  waterTemp: numberOrNull(values.waterTemp),
  beanAmount: numberOrNull(values.beanAmount),
  waterAmount: numberOrNull(values.waterAmount),
  rating: values.rating,
  note: values.note.trim() || null,
  brewDate: values.brewDate || null,
  dripperId: values.dripperId || null,
  grinderId: values.grinderId || null,
  tempType: values.tempType,
  hasBypass: values.hasBypass,
  iceAmount: values.tempType === "ice" ? numberOrNull(values.iceAmount) : null,
  yieldAmount: numberOrNull(values.yieldAmount),
  drawdownTime: numberOrNull(values.drawdownTime),
  bloomingTime: numberOrNull(values.bloomingTime),
  pours: values.pours.map((pour, index) => ({
    pourNumber: pour.pourNumber,
    waterAmount: pour.waterAmount,
    duration: index === values.pours.length - 1 ? 0 : pour.duration,
    pourType: pour.pourType,
  })),
});

export const toLogUpdateInput = (values: LogFormValues): LogUpdateInput => toLogCreateInput(values);

export { getRoastLabel };

export const getGrindLabel = (
  clicks: number,
  grinder: {
    fineMax: number;
    mediumFineMax: number;
    mediumMax: number;
    mediumCoarseMax: number;
  } | null,
) => {
  const fineMax = grinder?.fineMax ?? 6;
  const mediumFineMax = grinder?.mediumFineMax ?? 9;
  const mediumMax = grinder?.mediumMax ?? 15;
  const mediumCoarseMax = grinder?.mediumCoarseMax ?? 22;
  if (clicks <= fineMax) return "細挽き";
  if (clicks <= mediumFineMax) return "中細挽き";
  if (clicks <= mediumMax) return "中挽き";
  if (clicks <= mediumCoarseMax) return "中粗挽き";
  return "粗挽き";
};

export const waterAmountOptions = Array.from({ length: 19 }, (_, index) => 10 + index * 5);
export const durationOptions = Array.from({ length: 13 }, (_, index) => index * 5);

export const optionsWithCurrent = (options: number[], current: number) => {
  if (!current || options.includes(current)) return options;
  return [...options, current].toSorted((a, b) => a - b);
};

export const getTodayJSTString = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + 9 * 60 * 60 * 1000);
  return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, "0")}-${String(jst.getDate()).padStart(2, "0")}`;
};

export const makePour = (index: number, bloomingTime: number | ""): PourFormValue => ({
  pourNumber: index + 1,
  waterAmount: 30,
  duration: index === 0 && bloomingTime !== "" ? bloomingTime : 30,
  pourType: "center_around",
});
