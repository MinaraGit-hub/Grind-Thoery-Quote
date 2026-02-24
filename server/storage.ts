import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  submissions, formSettings,
  type Submission, type InsertSubmission,
  type FormSettings, type InsertFormSettings,
  type UpdateSettingsRequest,
  DEFAULT_PRICING_CONFIG
} from "@shared/schema";

export interface IStorage {
  getSettings(): Promise<FormSettings>;
  updateSettings(settings: UpdateSettingsRequest): Promise<FormSettings>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissions(): Promise<Submission[]>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<FormSettings> {
    const [settings] = await db.select().from(formSettings).limit(1);
    
    if (!settings) {
      const [newSettings] = await db.insert(formSettings).values({
        pricingConfig: DEFAULT_PRICING_CONFIG
      }).returning();
      return newSettings;
    }
    
    if (!settings.pricingConfig || Object.keys(settings.pricingConfig).length === 0) {
      const [updated] = await db
        .update(formSettings)
        .set({ pricingConfig: DEFAULT_PRICING_CONFIG, updatedAt: new Date() })
        .where(eq(formSettings.id, settings.id))
        .returning();
      return updated;
    }

    const merged = { ...DEFAULT_PRICING_CONFIG, ...settings.pricingConfig };
    if (JSON.stringify(merged) !== JSON.stringify(settings.pricingConfig)) {
      const [updated] = await db
        .update(formSettings)
        .set({ pricingConfig: merged, updatedAt: new Date() })
        .where(eq(formSettings.id, settings.id))
        .returning();
      return updated;
    }
    
    return settings;
  }

  async updateSettings(settings: UpdateSettingsRequest): Promise<FormSettings> {
    const [existing] = await db.select().from(formSettings).limit(1);
    
    if (existing) {
      const [updated] = await db
        .update(formSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(formSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(formSettings).values({
        ...settings as InsertFormSettings,
        pricingConfig: settings.pricingConfig || DEFAULT_PRICING_CONFIG
      }).returning();
      return created;
    }
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [created] = await db.insert(submissions).values(submission).returning();
    return created;
  }

  async getSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions).orderBy(desc(submissions.createdAt));
  }
}

export const storage = new DatabaseStorage();
