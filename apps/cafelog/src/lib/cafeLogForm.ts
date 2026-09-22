import { z } from "zod";
import type { SelectedImage } from "@/components/ImagePicker";
import { PREFECTURES } from "@/lib/prefectures";

export type CafeLogFormValues = {
  cafeName: string;
  cafeLinks: string[];
  prefecture: string;
  origin: string;
  region: string;
  variety: string;
  farm: string;
  producer: string;
  process: string;
  roast: string;
  isBlend: boolean;
  servingStyle: "hot" | "iced" | null;
  flavorNote: string;
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
  cafeLinks: z.array(optionalUrlSchema).max(10, "お店のリンクは10件まで登録できます。"),
  prefecture: z.union([z.literal(""), z.enum(PREFECTURES)]),
  origin: z.string(),
  region: z.string(),
  variety: z.string(),
  farm: z.string(),
  producer: z.string(),
  process: z.string(),
  roast: z.string(),
  isBlend: z.boolean(),
  servingStyle: z.enum(["hot", "iced"]).nullable(),
  flavorNote: z.string(),
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
    cafeLinks: [""],
    prefecture: "",
    origin: "",
    region: "",
    variety: "",
    farm: "",
    producer: "",
    process: "",
    roast: "",
    isBlend: false,
    servingStyle: "hot",
    flavorNote: "",
    rating: 3,
    price: "",
    visitDate: `${yyyy}-${mm}-${dd}`,
    note: "",
    images: [],
  };
};

export const toCafeLogPayload = (values: CafeLogFormValues) => ({
  cafeName: values.cafeName.trim(),
  cafeLinks: values.cafeLinks.map((url) => url.trim()).filter(Boolean),
  prefecture: values.prefecture || null,
  origin: values.origin.trim() || null,
  region: values.region.trim() || null,
  variety: values.variety.trim() || null,
  farm: values.farm.trim() || null,
  producer: values.producer.trim() || null,
  process: values.process.trim() || null,
  roast: values.roast.trim() || null,
  isBlend: values.isBlend,
  servingStyle: values.servingStyle,
  flavorNote: values.flavorNote.trim() || null,
  rating: values.rating,
  price: values.price.trim() === "" ? null : Number(values.price),
  note: values.note.trim() || null,
  visitDate: values.visitDate || null,
});
