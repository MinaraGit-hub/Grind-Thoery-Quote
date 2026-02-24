import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface PricingConfig {
  hourlyPricing: Record<string, number>;
  customHoursBase: number;
  customHoursExtra: number;
  customHoursMin: number;
  basePackagePrice: number;
  guestModifiers: Record<string, number>;
  signatureDrinksList: string[];
  signatureDrinkPrice: number;
  matchaOptions: Record<string, number>;
  cannedOptions: Array<{ label: string; value: string; price: number }>;
  bakedGoodsPerItem: number;
  bakedGoodsBulkPrice: number;
  bakedGoodsBulkCount: number;
  altMilkTiers: Record<string, number>;
  altMilkExtraPerHour: number;
  altMilkMinHours: number;
  stickerDesignFee: number;
  stickerBasePrint: number;
  stickerBaseCups: number;
  stickerExtraCupStep: number;
  stickerExtraPerStep: number;
  sleeveDesignFee: number;
  sleeveBasePrint: number;
  sleeveBaseCups: number;
  sleeveExtraCupStep: number;
  sleeveExtraPerStep: number;
  cartBrandingOptions: Record<string, number>;
  basePackageItems: string[];
  costRangeBuffer: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  hourlyPricing: { "2": 200, "3": 400, "4": 600, "5": 800 },
  customHoursBase: 800,
  customHoursExtra: 200,
  customHoursMin: 6,
  basePackagePrice: 650,
  guestModifiers: {
    "1–30": 0,
    "30–60": 10,
    "60–100": 25,
    "100–150": 40,
    "150–250": 65,
    "250+": 75
  },
  signatureDrinksList: [
    "Tiramisu iced latte",
    "Banana cheesecake cold foam latte",
    "Biscoff cold foam latte",
    "Iced dirty matcha",
    "Cold brew / cold brew concentrate"
  ],
  signatureDrinkPrice: 10,
  matchaOptions: {
    "Standard Matcha (hot + iced)": 7,
    "Matcha specialty menu": 11
  },
  cannedOptions: [
    { label: "None", value: "none", price: 0 },
    { label: "10 cans", value: "10", price: 90 },
    { label: "20 cans", value: "20", price: 170 },
    { label: "50 cans", value: "50", price: 400 },
    { label: "100 cans", value: "100", price: 750 },
    { label: "200 cans", value: "200", price: 1300 }
  ],
  bakedGoodsPerItem: 7,
  bakedGoodsBulkPrice: 180,
  bakedGoodsBulkCount: 40,
  altMilkTiers: { "2": 200, "3": 400, "4": 400, "5": 600, "6": 800 },
  altMilkExtraPerHour: 200,
  altMilkMinHours: 2,
  stickerDesignFee: 120,
  stickerBasePrint: 250,
  stickerBaseCups: 1000,
  stickerExtraCupStep: 200,
  stickerExtraPerStep: 50,
  sleeveDesignFee: 250,
  sleeveBasePrint: 400,
  sleeveBaseCups: 1000,
  sleeveExtraCupStep: 200,
  sleeveExtraPerStep: 80,
  cartBrandingOptions: { "vinyl": 150, "magnetic": 280, "acrylic": 600 },
  basePackageItems: [
    "Espresso machine",
    "Grinder",
    "Water system",
    "Cups, lids, napkins",
    "Premium beans",
    "2 staff (minimum)",
    "Standard menu",
    "Setup + Packdown"
  ],
  costRangeBuffer: 400
};

export const formSettings = pgTable("form_settings", {
  id: serial("id").primaryKey(),
  baseRate: integer("base_rate").notNull().default(50),
  hourlyRates: jsonb("hourly_rates").$type<Record<string, number>>().notNull().default({
    "1": 50,
    "2": 90,
    "3": 130,
    "4": 160
  }),
  eventSurplus: jsonb("event_surplus").$type<Record<string, number>>().notNull().default({
    "Corporate": 10,
    "Wedding": 15,
    "Private Function": 0,
    "Market/Festival": 10,
    "School/Community": -10
  }),
  pricingConfig: jsonb("pricing_config").$type<PricingConfig>().notNull().default(DEFAULT_PRICING_CONFIG),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  eventType: text("event_type").notNull().default("Private Function"),
  hours: integer("hours").notNull(),
  hasAddon: boolean("has_addon").notNull().default(false),
  signatureDrinks: jsonb("signature_drinks").$type<Record<string, number>>().notNull().default({}),
  matchaUpgrade: jsonb("matcha_upgrade").$type<Record<string, number>>().notNull().default({}),
  cannedBeverages: text("canned_beverages").notNull().default("none"),
  bakedGoods: jsonb("baked_goods").$type<{ count: number; useBulk: boolean }>().notNull().default({ count: 0, useBulk: false }),
  alternativeMilk: integer("alternative_milk").notNull().default(0),
  branding: jsonb("branding").$type<{ 
    cupCustomization: string; 
    stickerCups: number; 
    stickerPrice: number;
    sleeveCups: number;
    sleevePrice: number;
    cartBranding: string;
    cartPrice: number;
  }>().notNull().default({
    cupCustomization: "none",
    stickerCups: 1000,
    stickerPrice: 0,
    sleeveCups: 1000,
    sleevePrice: 0,
    cartBranding: "none",
    cartPrice: 0
  }),
  guestCount: text("guest_count").notNull().default("1–30"),
  calculatedCost: integer("calculated_cost").notNull(),
  wantEmail: boolean("want_email").notNull().default(false),
  emailAddress: text("email_address"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFormSettingsSchema = createInsertSchema(formSettings).omit({ id: true, updatedAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, createdAt: true, status: true });

export type FormSettings = typeof formSettings.$inferSelect;
export type InsertFormSettings = z.infer<typeof insertFormSettingsSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type CreateSubmissionRequest = InsertSubmission;
export type UpdateSettingsRequest = Partial<InsertFormSettings>;

export type SettingsResponse = FormSettings;
export type SubmissionResponse = Submission;
export type SubmissionsListResponse = Submission[];
