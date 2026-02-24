import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  submissions, formSettings,
  type Submission, type InsertSubmission,
  type FormSettings, type InsertFormSettings,
  type UpdateSettingsRequest
} from "@shared/schema";

export interface IStorage {
  // Form Settings
  getSettings(): Promise<FormSettings>;
  updateSettings(settings: UpdateSettingsRequest): Promise<FormSettings>;

  // Submissions
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissions(): Promise<Submission[]>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<FormSettings> {
    const [settings] = await db.select().from(formSettings).limit(1);
    
    // Create default settings if none exist
    if (!settings) {
      const [newSettings] = await db.insert(formSettings).values({}).returning();
      return newSettings;
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
      const [created] = await db.insert(formSettings).values(settings as InsertFormSettings).returning();
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
