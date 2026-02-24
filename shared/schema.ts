import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Form settings for form configuration
export const formSettings = pgTable("form_settings", {
  id: serial("id").primaryKey(),
  // Base Rates
  baseRate: integer("base_rate").notNull().default(50),
  addonPrice: integer("addon_price").notNull().default(650),
  
  // Hourly Rates
  hourlyRates: jsonb("hourly_rates").$type<Record<string, number>>().notNull().default({
    "1": 50,
    "2": 90,
    "3": 130,
    "4": 160
  }),
  
  // Event Type Surpluses/Discounts
  eventSurplus: jsonb("event_surplus").$type<Record<string, number>>().notNull().default({
    "Corporate": 10,
    "Wedding": 15,
    "Private Function": 0,
    "Market/Festival": 10,
    "School/Community": -10
  }),

  // Signature Drinks Pricing
  signatureDrinkPrices: jsonb("signature_drink_prices").$type<Record<string, number>>().notNull().default({
    "1": 250,
    "2": 450,
    "3": 650
  }),

  // Matcha Upgrade Pricing
  matchaPrices: jsonb("matcha_prices").$type<Record<string, number>>().notNull().default({
    "Standard Matcha (hot + iced)": 150,
    "Matcha specialty menu": 250
  }),

  // Canned Beverages Pricing
  cannedBeveragePrices: jsonb("canned_beverage_prices").$type<Record<string, number>>().notNull().default({
    "20": 100,
    "40": 180,
    "60": 250
  }),

  // Baked Goods Pricing
  bakedGoodsPrices: jsonb("baked_goods_prices").$type<{ unit: number; bulk40: number }>().notNull().default({
    unit: 6,
    bulk40: 200
  }),

  // Branding Pricing
  brandingPrices: jsonb("branding_prices").$type<{ 
    stickers: number; 
    sleeves: number;
    cart: number;
  }>().notNull().default({
    stickers: 150,
    sleeves: 200,
    cart: 300
  }),

  // Travel/Distance Pricing
  travelPrices: jsonb("travel_prices").$type<Record<string, number>>().notNull().default({
    "0-20km": 0,
    "20-40km": 50,
    "40-60km": 100,
    "60km+": 150
  }),

  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form submissions
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

// === BASE SCHEMAS ===
export const insertFormSettingsSchema = createInsertSchema(formSettings).omit({ id: true, updatedAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, createdAt: true, status: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type FormSettings = typeof formSettings.$inferSelect;
export type InsertFormSettings = z.infer<typeof insertFormSettingsSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

// Request types
export type CreateSubmissionRequest = InsertSubmission;
export type UpdateSettingsRequest = Partial<InsertFormSettings>;

// Response types
export type SettingsResponse = FormSettings;
export type SubmissionResponse = Submission;
export type SubmissionsListResponse = Submission[];
