/**
 * Cloudflare Worker - Email Bridge
 * 
 * This worker handles incoming emails via Cloudflare Email Routing
 * and forwards them to the Vercel API webhook.
 * 
 * Setup:
 * 1. Deploy this script to Cloudflare Workers
 * 2. Set environment variables:
 *    - WEBHOOK_URL: Your Vercel deployment URL + /api/inbound
 *    - API_KEY: Same value as INBOUND_SECRET in your Vercel env
 * 3. Configure Email Routing to forward emails to this worker
 */

export interface Env {
  WEBHOOK_URL: string;
  API_KEY: string;
}

// Allowed sender domains (add more as needed)
const ALLOWED_DOMAINS = [
  "facebookmail.com",
  "instagram.com",
  // Add more allowed domains here
];

function isAllowedSender(from: string): boolean {
  // If ALLOWED_DOMAINS is empty, allow all
  if (ALLOWED_DOMAINS.length === 0) return true;
  
  return ALLOWED_DOMAINS.some((domain) =>
    from.toLowerCase().includes(`@${domain}`)
  );
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const from = message.from;
    const to = message.to;

    // Filter: Only process emails from allowed domains
    if (!isAllowedSender(from)) {
      console.log(`Rejected email from: ${from} (not in allowed domains)`);
      // Silently reject by not forwarding
      message.setReject("Sender not allowed");
      return;
    }

    try {
      // Read the raw email content
      const rawEmail = await new Response(message.raw).text();

      // Extract subject from raw email headers
      const subjectMatch = rawEmail.match(/^Subject:\s*(.+)$/im);
      const subject = subjectMatch ? subjectMatch[1].trim() : "";

      // Prepare payload for webhook
      const payload = {
        to: to,
        from: from,
        subject: subject,
        raw: rawEmail,
      };

      // Send to Vercel API
      const response = await fetch(env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook error: ${response.status} - ${errorText}`);
        throw new Error(`Webhook returned ${response.status}`);
      }

      const result = await response.json();
      console.log(`Email processed successfully:`, result);

    } catch (error) {
      console.error("Failed to process email:", error);
      // Don't reject the email on our side - it was received
      // Just log the error for debugging
    }
  },
};
