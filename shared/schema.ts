import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Form settings for form configuration
export const formSettings = pgTable("form_settings", {
  id: serial("id").primaryKey(),
  // Configuration for each step
  steps: jsonb("steps").$type<Record<string, any>>().notNull().default({
    "1": { title: "Personal Information", description: "" },
    "2": { title: "Event Package", description: "Base Service Rate", basePrice: 650 },
    "3": { title: "How many hours?", description: "", baseHourPrice: 800, extraHourPrice: 200 },
    "4": { title: "What type of event is it?", description: "" },
    "5": { title: "Signature Drinks", description: "", pricePerDrink: 10 },
    "6": { title: "Custom Upgrade", description: "" },
    "7": { title: "Baked Goods Add-ons", description: "", pastryPrice: 7, bulkPastryPrice: 180 },
    "8": { title: "Branding Upgrades", description: "" }
  }),
  // Pricing variables and percentages
  pricing: jsonb("pricing").$type<Record<string, any>>().notNull().default({
    guestTiers: {
      "1–30": 0,
      "30–60": 0.10,
      "60–100": 0.25,
      "100–150": 0.40,
      "150–250": 0.65,
      "250+": 0.75
    },
    eventSurplus: {
      "Corporate": 10,
      "Wedding": 15,
      "Private Function": 0,
      "Market/Festival": 10,
      "School/Community": -10
    },
    hourPackages: {
      "2": 200,
      "3": 400,
      "4": 600,
      "5": 800
    },
    matcha: {
      standard: 7,
      specialty: 11
    },
    branding: {
      stickers: { base: 120, per200: 50 },
      sleeves: { base: 250, per200: 80 },
      cart: { vinyl: 150, magnetic: 280, acrylic: 600 }
    }
  }),
  // Items for various steps
  items: jsonb("items").$type<Record<string, any>>().notNull().default({
    signatureDrinks: [
      "Iced latte", "Iced dirty matcha", "Strawberry matcha", 
      "Mango matcha", "Pistachio latte", "Spanish latte", 
      "Biscoff latte", "Taro latte", "Blueberry latte"
    ],
    matchaUpgrades: [
      "Standard Matcha (hot + iced)", 
      "Matcha specialty menu"
    ],
    cannedBeverages: [
      { label: "None", value: "none", price: 0 },
      { label: "20 Cans", value: "20", price: 80 },
      { label: "40 Cans", value: "40", price: 150 },
      { label: "60 Cans", value: "60", price: 210 }
    ]
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
