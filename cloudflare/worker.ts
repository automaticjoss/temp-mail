/**
 * Cloudflare Worker - Email Bridge (2-Way)
 *
 * Handles:
 * 1. EMAIL → Receives inbound emails via CF Email Routing → forwards to TMailDash webhook
 * 2. GET /  → Health check / status
 * 3. POST /send → (Future) Send email via MailChannels (free on CF Workers)
 *
 * Setup:
 * 1. `cd cloudflare && npx wrangler deploy`
 * 2. Set environment variables in CF Dashboard:
 *    - WEBHOOK_URL: https://your-tmaildash.vercel.app/api/inbound
 *    - API_KEY: Same value as INBOUND_SECRET in your Vercel env
 * 3. Email Routing: CF Dashboard → Email → Email Routing → Catch-all → Send to Worker
 */

export interface Env {
  WEBHOOK_URL: string;
  API_KEY: string;
}

export default {
  // ─── HTTP Handler (GET/POST) ───────────────────────────────
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // GET / → Health check & status
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "online",
          service: "TMailDash Email Bridge",
          webhook: env.WEBHOOK_URL ? "configured" : "not configured",
          endpoints: {
            "GET /": "Health check (this)",
            "POST /send": "Send email via MailChannels",
            "EMAIL": "Auto-forward inbound emails to webhook",
          },
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // POST /send → Send email via MailChannels (free on CF Workers)
    if (request.method === "POST" && url.pathname === "/send") {
      // Verify API key
      const authKey =
        request.headers.get("x-api-key") ||
        request.headers.get("Authorization")?.replace("Bearer ", "");

      if (!authKey || authKey !== env.API_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      try {
        const body = await request.json() as {
          from: { email: string; name?: string };
          to: string;
          subject: string;
          text?: string;
          html?: string;
        };

        const { from, to, subject, text, html } = body;

        if (!from?.email || !to || !subject) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: from.email, to, subject" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        // Send via MailChannels (free for CF Workers)
        const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: from.email, name: from.name || "TMailDash" },
            subject,
            content: [
              {
                type: html ? "text/html" : "text/plain",
                value: html || text || "",
              },
            ],
          }),
        });

        if (mailRes.status === 202 || mailRes.ok) {
          return new Response(
            JSON.stringify({ success: true, message: "Email sent" }),
            {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        const errText = await mailRes.text();
        return new Response(
          JSON.stringify({ error: "MailChannels error", details: errText }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Invalid request body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },

  // ─── Email Handler (Inbound) ──────────────────────────────
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const from = message.from;
    const to = message.to;

    console.log(`📨 Inbound email: ${from} → ${to}`);

    try {
      // Read the raw email
      const rawEmail = await new Response(message.raw).text();

      // Extract subject from raw headers
      const subjectMatch = rawEmail.match(/^Subject:\s*(.+)$/im);
      const subject = subjectMatch ? subjectMatch[1].trim() : "";

      // Forward to TMailDash webhook
      const response = await fetch(env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify({
          to,
          from,
          subject,
          raw: rawEmail,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook error: ${response.status} - ${errorText}`);
        throw new Error(`Webhook returned ${response.status}`);
      }

      console.log(`✅ Email forwarded: ${from} → ${to}`);
    } catch (error) {
      console.error("Failed to process email:", error);
    }
  },
};
