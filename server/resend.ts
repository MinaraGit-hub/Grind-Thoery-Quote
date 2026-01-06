import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function sendQuoteEmail(
  toEmail: string,
  summary: {
    fullName: string;
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
) {
  const { client, fromEmail } = await getUncachableResendClient();

  const htmlContent = `
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

  const { data, error } = await client.emails.send({
    from: fromEmail || 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Your Grind Theory Coffee Catering Quote',
    html: htmlContent,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }

  return data;
}
