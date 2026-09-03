import { z } from "zod";

const nullableText = z.string().optional().nullable();
export const coffeeTypeSchema = z.enum(["regular", "specialty"]);

export const beanCreateSchema = z.object({
  name: z.string().min(1),
  coffeeType: coffeeTypeSchema.default("regular"),
  origin: nullableText,
  purchaseStore: nullableText,
  roastLevel: z.number().int().min(1).max(5).optional().nullable(),
  roastDate: nullableText,
  purchaseDate: nullableText,
  imageUrl: nullableText,
  processMethod: nullableText,
  note: nullableText,
  parentBeanId: z.string().uuid().optional().nullable(),
  version: nullableText,
});

export const beanUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  coffeeType: coffeeTypeSchema.optional(),
  origin: nullableText,
  purchaseStore: nullableText,
  roastLevel: z.number().int().min(1).max(5).optional().nullable(),
  roastDate: nullableText,
  purchaseDate: nullableText,
  imageUrl: nullableText,
  isArchived: z.boolean().optional(),
  processMethod: nullableText,
  note: nullableText,
  parentBeanId: z.string().uuid().optional().nullable(),
  version: nullableText,
});

const pourSchema = z.object({
  pourNumber: z.number().int().min(1),
  waterAmount: z.number().positive(),
  duration: z.number().int().nonnegative(),
  pourType: z.enum(["all", "center_around", "center_only"]),
});

export const logCreateSchema = z.object({
  beanId: z.string().uuid(),
  method: nullableText,
  grindSize: z.number().int().min(1).max(40).optional().nullable(),
  waterTemp: z.number().int().optional().nullable(),
  beanAmount: z.number().optional().nullable(),
  waterAmount: z.number().optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  note: nullableText,
  brewDate: nullableText,
  dripperId: z.string().uuid().optional().nullable(),
  grinderId: z.string().uuid().optional().nullable(),
  tempType: z.enum(["hot", "ice"]).optional(),
  iceAmount: z.number().optional().nullable(),
  yieldAmount: z.number().optional().nullable(),
  drawdownTime: z.number().int().nonnegative().optional().nullable(),
  bloomingTime: z.number().int().nonnegative().optional().nullable(),
  hasBypass: z.boolean().optional(),
  pours: z.array(pourSchema).optional(),
});

export const logUpdateSchema = logCreateSchema.partial();

export const dripperCreateSchema = z.object({
  name: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const dripperUpdateSchema = dripperCreateSchema.partial();

export const grinderCreateSchema = z.object({
  name: z.string().min(1),
  fineMax: z.number().int().min(1).max(40),
  mediumFineMax: z.number().int().min(1).max(40),
  mediumMax: z.number().int().min(1).max(40),
  mediumCoarseMax: z.number().int().min(1).max(40),
  isDefault: z.boolean().optional(),
});

export const grinderUpdateSchema = grinderCreateSchema.partial();

export type BeanCreateInput = z.infer<typeof beanCreateSchema>;
export type BeanUpdateInput = z.infer<typeof beanUpdateSchema>;
export type CoffeeType = z.infer<typeof coffeeTypeSchema>;
export type LogCreateInput = z.infer<typeof logCreateSchema>;
export type LogUpdateInput = z.infer<typeof logUpdateSchema>;
export type DripperCreateInput = z.infer<typeof dripperCreateSchema>;
export type DripperUpdateInput = z.infer<typeof dripperUpdateSchema>;
export type GrinderCreateInput = z.infer<typeof grinderCreateSchema>;
export type GrinderUpdateInput = z.infer<typeof grinderUpdateSchema>;
