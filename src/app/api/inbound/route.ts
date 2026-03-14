import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { simpleParser } from "mailparser";
import type { InsertEmail } from "@/types/database";

// Regex patterns for OTP/verification codes
// Matches: 123456, FB-34935, G-123456, 12345, 1234567, etc.
const OTP_PATTERNS = [
  /\b([A-Z]{1,4}[\s-]?\d{4,8})\b/i,  // FB-34935, G-123456
  /\b(\d{4,8})\b/,                     // 123456, 34935, 1234567
];

// Extract OTP/verification code from email content
function extractOTP(text: string): string | null {
  // First try prefixed codes like FB-34935
  const prefixMatch = text.match(/\b([A-Z]{1,4}[\s-]\d{4,8})\b/i);
  if (prefixMatch) return prefixMatch[1];
  // Then try plain digit codes (prefer 5-6 digits)
  const digitMatch = text.match(/\b(\d{5,6})\b/);
  if (digitMatch) return digitMatch[1];
  const anyDigit = text.match(/\b(\d{4,8})\b/);
  if (anyDigit) return anyDigit[1];
  return null;
}

// Check if the body likely contains an OTP/verification code
function hasOTP(text: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const hasKeyword = /verif|code|otp|confirm|kode|sandi/i.test(lower);
  const hasCode = OTP_PATTERNS.some(r => r.test(text));
  return hasKeyword && hasCode;
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
