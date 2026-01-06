import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Form settings for form configuration
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
  calculatedCost: integer("calculated_cost").notNull(),
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
