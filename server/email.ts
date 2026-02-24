import nodemailer from "nodemailer";

const ADMIN_EMAIL = "sale@grindtheory.au";

function getTransporter() {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("SMTP_EMAIL and SMTP_APP_PASSWORD environment variables are required");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export interface QuoteSummary {
  fullName: string;
  mobileNumber: string;
  eventPackage: string;
  guestCount: string;
  hours: string;
  eventType: string;
  signatureDrinks: string;
  customUpgrades: string;
  bakedGoods: string;
  brandingUpgrades: string;
  estimatedCostLow: number;
  estimatedCostHigh: number;
}

function buildCustomerHtml(summary: QuoteSummary): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f0eb; border-radius: 12px;">
      <h1 style="color: #6B5E51; text-align: center;">Your Quote Estimate</h1>
      <p style="color: #6B5E51;">Hi ${summary.fullName},</p>
      <p style="color: #6B5E51;">Thank you for your interest in Grind Theory coffee catering. Here's your quote summary:</p>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #6B5E51; border-bottom: 1px solid #e0d5ca; padding-bottom: 10px;">Quote Estimate Summary</h2>
        <ul style="list-style: none; padding: 0; color: #6B5E51;">
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Event package:</strong> ${summary.eventPackage}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Guest count:</strong> ${summary.guestCount}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Number of hours:</strong> ${summary.hours}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Event type:</strong> ${summary.eventType}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Signature drinks:</strong> ${summary.signatureDrinks}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Custom upgrades:</strong> ${summary.customUpgrades}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Baked Goods Add-ons:</strong> ${summary.bakedGoods}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Branding Upgrades:</strong> ${summary.brandingUpgrades}</li>
          <li style="padding: 8px 0; font-size: 0.9em; color: #888;"><strong>Miscellaneous costs:</strong> Varies (travel, power, accessibility, extra staff)</li>
        </ul>
      </div>
      
      <div style="background: #6B5E51; color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 0.9em; text-transform: uppercase; letter-spacing: 2px;">Estimated Cost</p>
        <p style="margin: 10px 0 0 0; font-size: 1.8em; font-weight: bold;">$${summary.estimatedCostLow} – $${summary.estimatedCostHigh}</p>
      </div>
      
      <p style="color: #888; font-size: 0.9em; text-align: center; margin-top: 20px;">
        This is an estimate only. Final pricing may vary based on travel fee, power requirements, accessibility, and extra staff requirements.
      </p>
    </div>
  `;
}

function buildAdminHtml(summary: QuoteSummary): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f0eb; border-radius: 12px;">
      <h1 style="color: #6B5E51; text-align: center;">New Quote Request</h1>
      <p style="color: #6B5E51;">A new quote has been submitted via the website.</p>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #6B5E51; border-bottom: 1px solid #e0d5ca; padding-bottom: 10px;">Customer Details</h2>
        <ul style="list-style: none; padding: 0; color: #6B5E51;">
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Name:</strong> ${summary.fullName}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Mobile:</strong> ${summary.mobileNumber}</li>
        </ul>
        
        <h2 style="color: #6B5E51; border-bottom: 1px solid #e0d5ca; padding-bottom: 10px; margin-top: 20px;">Quote Details</h2>
        <ul style="list-style: none; padding: 0; color: #6B5E51;">
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Event package:</strong> ${summary.eventPackage}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Guest count:</strong> ${summary.guestCount}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Number of hours:</strong> ${summary.hours}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Event type:</strong> ${summary.eventType}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Signature drinks:</strong> ${summary.signatureDrinks}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Custom upgrades:</strong> ${summary.customUpgrades}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Baked Goods Add-ons:</strong> ${summary.bakedGoods}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;"><strong>Branding Upgrades:</strong> ${summary.brandingUpgrades}</li>
        </ul>
      </div>
      
      <div style="background: #6B5E51; color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 0.9em; text-transform: uppercase; letter-spacing: 2px;">Estimated Cost</p>
        <p style="margin: 10px 0 0 0; font-size: 1.8em; font-weight: bold;">$${summary.estimatedCostLow} – $${summary.estimatedCostHigh}</p>
      </div>
    </div>
  `;
}

export async function sendAdminNotification(summary: QuoteSummary): Promise<void> {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_EMAIL!;

  await transporter.sendMail({
    from: fromEmail,
    to: ADMIN_EMAIL,
    subject: `New Quote Request from ${summary.fullName}`,
    html: buildAdminHtml(summary),
  });
}

export async function sendCustomerQuoteEmail(toEmail: string, summary: QuoteSummary): Promise<void> {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_EMAIL!;

  await transporter.sendMail({
    from: `"Grind Theory" <${fromEmail}>`,
    to: toEmail,
    subject: "Your Grind Theory Coffee Catering Quote",
    html: buildCustomerHtml(summary),
  });
}
