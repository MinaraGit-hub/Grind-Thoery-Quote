import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import {
  type FormSettings,
  type Submission,
  type InsertSubmission,
  type UpdateSettingsRequest,
  DEFAULT_PRICING_CONFIG,
} from "@shared/schema";

const STORAGE_PATH = path.resolve(process.cwd(), "server", "data", "storage.json");

interface LocalStorageState {
  settings?: FormSettings;
  submissions: Submission[];
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
}

function parseSettings(settings: any): FormSettings {
  if (settings && typeof settings === "object" && settings.updatedAt) {
    settings.updatedAt = parseDate(settings.updatedAt) ?? new Date();
  }
  return settings as FormSettings;
}

function parseSubmission(submission: any): Submission {
  if (submission && typeof submission === "object" && submission.createdAt) {
    submission.createdAt = parseDate(submission.createdAt) ?? new Date();
  }
  return submission as Submission;
}

async function readState(): Promise<LocalStorageState> {
  await mkdir(path.dirname(STORAGE_PATH), { recursive: true });

  try {
    const raw = await readFile(STORAGE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as LocalStorageState;
    return {
      settings: parsed.settings ? parseSettings(parsed.settings) : undefined,
      submissions: Array.isArray(parsed.submissions)
        ? parsed.submissions.map(parseSubmission)
        : [],
    };
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      const initialState: LocalStorageState = { submissions: [] };
      await writeFile(STORAGE_PATH, JSON.stringify(initialState, null, 2), "utf-8");
      return initialState;
    }
    throw error;
  }
}

async function writeState(state: LocalStorageState): Promise<void> {
  await mkdir(path.dirname(STORAGE_PATH), { recursive: true });
  await writeFile(STORAGE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

function getDefaultSettings(): FormSettings {
  return {
    id: 1,
    baseRate: 50,
    hourlyRates: {
      "1": 50,
      "2": 90,
      "3": 130,
      "4": 160,
    },
    eventSurplus: {
      Corporate: 10,
      Wedding: 15,
      "Private Function": 0,
      "Market/Festival": 10,
      "School/Community": -10,
    },
    pricingConfig: DEFAULT_PRICING_CONFIG,
    updatedAt: new Date(),
  };
}

function nextSubmissionId(submissions: Submission[]): number {
  return submissions.reduce((maxId, submission) => Math.max(maxId, submission.id ?? 0), 0) + 1;
}

export interface IStorage {
  getSettings(): Promise<FormSettings>;
  updateSettings(settings: UpdateSettingsRequest): Promise<FormSettings>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissions(): Promise<Submission[]>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<FormSettings> {
    const state = await readState();

    if (!state.settings) {
      const initialSettings = getDefaultSettings();
      state.settings = initialSettings;
      await writeState(state);
      return initialSettings;
    }

    if (!state.settings.pricingConfig || Object.keys(state.settings.pricingConfig).length === 0) {
      state.settings.pricingConfig = DEFAULT_PRICING_CONFIG;
      state.settings.updatedAt = new Date();
      await writeState(state);
      return state.settings;
    }

    return state.settings;
  }

  async updateSettings(settings: UpdateSettingsRequest): Promise<FormSettings> {
    const state = await readState();
    const existing = state.settings ?? getDefaultSettings();

    const updated: FormSettings = {
      ...existing,
      ...settings,
      pricingConfig: settings.pricingConfig ?? existing.pricingConfig,
      updatedAt: new Date(),
    } as FormSettings;

    state.settings = updated;
    await writeState(state);
    return updated;
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const state = await readState();
    const newSubmission: Submission = {
      id: nextSubmissionId(state.submissions),
      status: "new",
      createdAt: new Date(),
      ...submission,
    } as Submission;

    state.submissions = [newSubmission, ...state.submissions];
    await writeState(state);
    return newSubmission;
  }

  async getSubmissions(): Promise<Submission[]> {
    const state = await readState();
    return [...state.submissions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new DatabaseStorage();
