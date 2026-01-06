import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./replit_integrations/auth";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { sendQuoteEmail } from "./resend";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);

  // === Form Settings Routes ===
  
  // Public route to get settings (for cost calculation)
  app.get(api.settings.get.path, async (_req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  // Protected route to update settings
  app.post(api.settings.update.path, isAuthenticated, async (req, res) => {
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

      if (input.wantEmail && input.emailAddress) {
        const emailAddr: string = input.emailAddress;
        try {
          const hoursDisplay = String(input.hours) + " hours";
          const totalSigDrinks = Object.values(input.signatureDrinks || {}).reduce((a: number, b: number) => a + b, 0);
          const standardMatcha = (input.matchaUpgrade as Record<string, number>)?.["Standard Matcha (hot + iced)"] || 0;
          const specialtyMatcha = (input.matchaUpgrade as Record<string, number>)?.["Matcha specialty menu"] || 0;
          const bakedGoodsData = input.bakedGoods as { count: number; useBulk: boolean };
          const brandingData = input.branding as { cupCustomization: string; cartBranding: string };

          await sendQuoteEmail(emailAddr, {
            fullName: input.fullName,
            eventPackage: input.hasAddon ? "Base Package (+$650)" : "Not selected",
            guestCount: input.guestCount || "1–30",
            hours: hoursDisplay,
            eventType: input.eventType || "Not selected",
            signatureDrinks: `${totalSigDrinks} drinks`,
            customUpgrades: `${standardMatcha + specialtyMatcha} matcha, ${input.cannedBeverages !== "none" ? input.cannedBeverages + " cans" : "No cans"}`,
            bakedGoods: `${bakedGoodsData?.useBulk ? "40 Bulk Pack" : (bakedGoodsData?.count || 0) + " pastries"}`,
            brandingUpgrades: `${brandingData?.cupCustomization !== "none" ? (brandingData?.cupCustomization === "stickers" ? "Stickers" : "Sleeves") : "None"}${brandingData?.cartBranding !== "none" ? ", " + brandingData?.cartBranding : ""}`,
            estimatedCostLow: input.calculatedCost,
            estimatedCostHigh: input.calculatedCost + 400,
          });
        } catch (emailError) {
          console.error("Failed to send quote email:", emailError);
        }
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
  app.get(api.submissions.list.path, isAuthenticated, async (_req, res) => {
    const submissions = await storage.getSubmissions();
    res.json(submissions);
  });

  return httpServer;
}
