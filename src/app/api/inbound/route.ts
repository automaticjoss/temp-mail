import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { simpleParser } from "mailparser";
import type { InsertEmail } from "@/types/database";

// Regex to find 6-digit OTP codes
const OTP_REGEX = /\b(\d{6})\b/;

// Extract OTP from email content
function extractOTP(text: string): string | null {
  const match = text.match(OTP_REGEX);
  return match ? match[1] : null;
}

// Check if the body contains a 6-digit OTP
function hasOTP(text: string | null): boolean {
  if (!text) return false;
  return OTP_REGEX.test(text);
}

export async function POST(request: NextRequest) {
  // Security: Check API key
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.INBOUND_SECRET;

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { to, from, subject, raw } = body as { to: string; from: string; subject?: string; raw?: string };

    // Validate required fields
    if (!to || !from) {
      return NextResponse.json(
        { error: "Missing required fields: to, from" },
        { status: 400 }
      );
    }

    // Parse raw email content using mailparser
    let bodyHtml: string | null = null;
    let bodyText: string | null = null;

    if (raw) {
      try {
        const parsed = await simpleParser(raw);
        bodyHtml = parsed.html || null;
        bodyText = parsed.text || null;
      } catch (parseError) {
        console.error("Failed to parse raw email:", parseError);
        // If parsing fails, store the raw content as text
        bodyText = raw;
      }
    }

    // Check if email contains OTP
    const isOtp = hasOTP(bodyText) || hasOTP(bodyHtml);

    // Store in Supabase using service client
    const supabase = createServiceClient();
    
    const insertData: InsertEmail = {
      recipient: to,
      sender: from,
      subject: subject || null,
      body_html: bodyHtml,
      body_text: bodyText,
      raw_content: raw || null,
      is_otp: isOtp,
    };

    const { data, error } = await supabase
      .from("emails")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to store email", details: error.message },
        { status: 500 }
      );
    }

    // Extract OTP if present for response
    const otp = bodyText ? extractOTP(bodyText) : (bodyHtml ? extractOTP(bodyHtml) : null);

    return NextResponse.json({
      success: true,
      id: data?.id ?? null,
      is_otp: isOtp,
      otp: otp,
    });
  } catch (error) {
    console.error("Inbound webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/inbound",
    method: "POST",
    required_headers: ["x-api-key"],
    required_body: ["to", "from", "subject", "raw"],
  });
}
