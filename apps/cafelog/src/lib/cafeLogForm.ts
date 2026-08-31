import { z } from "zod";
import type { SelectedImage } from "@/components/ImagePicker";

export type CafeLogFormValues = {
  cafeName: string;
  cafeUrl: string;
  origin: string;
  region: string;
  variety: string;
  farm: string;
  process: string;
  roast: string;
  isBlend: boolean;
  servingStyle: "hot" | "iced" | null;
  rating: number | null;
  price: string;
  visitDate: string;
  note: string;
  images: SelectedImage[];
};

const optionalUrlSchema = z.string().refine((value) => {
  if (!value.trim()) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "httpまたはhttpsのURLを入力してください。");

const optionalPriceSchema = z
  .string()
  .refine(
    (value) => value.trim() === "" || /^(0|[1-9]\d*)$/.test(value.trim()),
    "金額には0以上の整数を入力してください。",
  );

export const cafeLogFormSchema = z.object({
  cafeName: z.string().trim().min(1, "店舗名は必須項目です。"),
  cafeUrl: optionalUrlSchema,
  origin: z.string(),
  region: z.string(),
  variety: z.string(),
  farm: z.string(),
  process: z.string(),
  roast: z.string(),
  isBlend: z.boolean(),
  servingStyle: z.enum(["hot", "iced"]).nullable(),
  rating: z.number().min(1).max(5).nullable(),
  price: optionalPriceSchema,
  visitDate: z.string(),
  note: z.string(),
  images: z.array(z.custom<SelectedImage>()),
});

export const createCafeLogDefaults = (): CafeLogFormValues => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return {
    cafeName: "",
    cafeUrl: "",
    origin: "",
    region: "",
    variety: "",
    farm: "",
    process: "",
    roast: "",
    isBlend: false,
    servingStyle: "hot",
    rating: 3,
    price: "",
    visitDate: `${yyyy}-${mm}-${dd}`,
    note: "",
    images: [],
  };
};

export const toCafeLogPayload = (values: CafeLogFormValues) => ({
  cafeName: values.cafeName.trim(),
  cafeUrl: values.cafeUrl.trim() || null,
  origin: values.origin.trim() || null,
  region: values.region.trim() || null,
  variety: values.variety.trim() || null,
  farm: values.farm.trim() || null,
  process: values.process.trim() || null,
  roast: values.roast.trim() || null,
  isBlend: values.isBlend,
  servingStyle: values.servingStyle,
  rating: values.rating,
  price: values.price.trim() === "" ? null : Number(values.price),
  note: values.note.trim() || null,
  visitDate: values.visitDate || null,
});
