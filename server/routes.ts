import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { sendAdminNotification, sendCustomerQuoteEmail, type QuoteSummary } from "./email";

function isAdminAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).isAdmin) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return true;
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(ip);
    return true;
  }
  return record.count < 5;
}

function recordAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    record.count++;
    record.lastAttempt = now;
  }
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "local-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: sessionTtl,
    },
  };

  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    sessionOptions.store = sessionStore;
  }

  app.set("trust proxy", 1);
  app.use(session(sessionOptions));

  // === Admin Auth Routes ===
  app.post("/api/admin/login", (req, res) => {
    const clientIp = req.ip || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ message: "Too many attempts. Please try again later." });
    }

    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "Gr!nd.quote.2025";

    if (typeof password === "string" && constantTimeCompare(password, adminPassword)) {
      (req.session as any).isAdmin = true;
      return res.json({ success: true });
    }

    recordAttempt(clientIp);
    return res.status(401).json({ message: "Incorrect password" });
  });

  app.post("/api/admin/logout", (req, res) => {
    (req.session as any).isAdmin = false;
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/admin/check", (req, res) => {
    if (req.session && (req.session as any).isAdmin) {
      return res.json({ authenticated: true });
    }
    return res.json({ authenticated: false });
  });

  // === Form Settings Routes ===
  
  // Public route to get settings (for cost calculation)
  app.get(api.settings.get.path, async (_req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  // Protected route to update settings
  app.post(api.settings.update.path, isAdminAuthenticated, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const updated = await storage.updateSettings(input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === Submission Routes ===

  // Public route to create submission
  app.post(api.submissions.create.path, async (req, res) => {
    try {
      const input = api.submissions.create.input.parse(req.body);
      
      // Calculate cost on server side too to verify integrity (optional but good practice)
      const settings = await storage.getSettings();
      // We trust the frontend sent correct calculatedCost for now as per schema
      // In a stricter app, we would recalculate:
      // const rates = settings.hourlyRates as Record<string, number>;
      // const rate = rates[String(input.hours)] || settings.baseRate;
      // const expectedCost = rate * input.hours;

      const submission = await storage.createSubmission(input);

      try {
        const pc = (settings.pricingConfig as any) || {};
        const hoursDisplay = String(input.hours) + " hours";
        const totalSigDrinks = Object.values(input.signatureDrinks || {}).reduce((a: number, b: number) => a + b, 0);
        const matchaUpgrade = (input.matchaUpgrade as Record<string, number>) || {};
        const totalMatcha = Object.values(matchaUpgrade).reduce((a: number, b: number) => a + b, 0);
        const bakedGoodsData = (input.bakedGoods as { count?: number; useBulk?: boolean }) || {};
        const brandingData = (input.branding as { cupCustomization?: string; cartBranding?: string }) || {};
        const costBuffer = pc?.costRangeBuffer ?? 400;

        const cupCustomization = brandingData?.cupCustomization || "none";
        const cartBranding = brandingData?.cartBranding || "none";

        const summary: QuoteSummary = {
          fullName: input.fullName,
          mobileNumber: input.mobileNumber,
          eventPackage: input.hasAddon ? `Base Package (+$${pc?.basePackagePrice ?? 650})` : "Not selected",
          guestCount: input.guestCount || "1–30",
          hours: hoursDisplay,
          eventType: input.eventType || "Not selected",
          eventDate: (input as any).eventDate || undefined,
          signatureDrinks: `${totalSigDrinks} drinks`,
          customUpgrades: `${totalMatcha} matcha, ${(input.cannedBeverages && input.cannedBeverages !== "none") ? input.cannedBeverages + " cans" : "No cans"}`,
          bakedGoods: `${bakedGoodsData?.useBulk ? `${pc?.bakedGoodsBulkCount ?? 40} Bulk Pack` : (bakedGoodsData?.count || 0) + " pastries"}`,
          brandingUpgrades: `${cupCustomization !== "none" ? (cupCustomization === "stickers" ? "Stickers" : "Sleeves") : "None"}${cartBranding !== "none" ? ", " + cartBranding : ""}`,
          estimatedCostLow: input.calculatedCost,
          estimatedCostHigh: input.calculatedCost + costBuffer,
        };

        await sendAdminNotification(summary);

        if (input.wantEmail && input.emailAddress) {
          await sendCustomerQuoteEmail(input.emailAddress, summary);
        }
      } catch (emailError) {
        console.error("Failed to send quote email:", emailError);
      }

      res.status(201).json(submission);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Protected route to view submissions
  app.get(api.submissions.list.path, isAdminAuthenticated, async (_req, res) => {
    const submissions = await storage.getSubmissions();
    res.json(submissions);
  });

  return httpServer;
}
