import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { simpleParser } from "mailparser";
import type { InsertEmail } from "@/types/database";

// Extract OTP/verification code smartly
// Priority: subject line > near-keyword codes > fallback
function extractOTP(text: string, subject?: string | null): string | null {
  // 1. Check subject line first (e.g. "014029 is your verification code", "FB-34935 is your confirmation code")
  if (subject) {
    // Known prefix pattern in subject: FB-34935, G-123456
    const subPrefixed = subject.match(/\b((?:FB|G|IG|WA|TW|OTP)[\s-]?\d{4,8})\b/i);
    if (subPrefixed) return subPrefixed[1];
    // Plain digits in subject
    const subDigit = subject.match(/\b(\d{4,8})\b/);
    if (subDigit) return subDigit[1];
  }

  // 2. Look for codes near verification keywords
  const nearKeyword = text.match(/(?:code|kode|otp|verif\w*|confirm\w*|sandi)[^\d]{0,30}(\d{4,8})/i);
  if (nearKeyword) return nearKeyword[1];

  // 3. Look for known-prefix codes like FB-34935, G-123456
  const prefixed = text.match(/\b((?:FB|G|IG|WA|TW|OTP)[\s-]\d{4,8})\b/i);
  if (prefixed) return prefixed[1];

  // 4. Fallback: standalone 5-6 digit code
  const digit = text.match(/\b(\d{5,6})\b/);
  if (digit) return digit[1];

  return null;
}

// Check if the body likely contains an OTP/verification code
function hasOTP(text: string | null, subject?: string | null): boolean {
  if (!text && !subject) return false;
  const combined = ((subject || '') + ' ' + (text || '')).toLowerCase();
  const hasKeyword = /verif|code|otp|confirm|kode|sandi/i.test(combined);
  const hasCode = /\b\d{4,8}\b/.test(combined);
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
    const isOtp = hasOTP(bodyText, subject) || hasOTP(bodyHtml, subject);

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
    const otp = extractOTP(bodyText || bodyHtml || '', subject);

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
