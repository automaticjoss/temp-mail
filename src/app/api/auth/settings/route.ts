import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const DEFAULT_DOMAINS = ["@domain.com", "@mail.test"];

export async function GET() {
  try {
    const sb = createServiceClient();

    const { data: domainsRow, error: domainsErr } = await sb
      .from("admin_config")
      .select("value")
      .eq("key", "domains")
      .single();

    const { data: usernameRow } = await sb
      .from("admin_config")
      .select("value")
      .eq("key", "admin_username")
      .single();

    return NextResponse.json({
      domains: domainsRow && !domainsErr ? JSON.parse(domainsRow.value) : DEFAULT_DOMAINS,
      username: usernameRow?.value || "admin",
    });
  } catch {
    // Table doesn't exist yet — return defaults
    return NextResponse.json({
      domains: DEFAULT_DOMAINS,
      username: "admin",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sb = createServiceClient();

    // Upsert domains
    if (body.domains) {
      await sb
        .from("admin_config")
        .upsert({ key: "domains", value: JSON.stringify(body.domains), updated_at: new Date().toISOString() }, { onConflict: "key" });
    }

    // Upsert username
    if (body.username) {
      await sb
        .from("admin_config")
        .upsert({ key: "admin_username", value: body.username, updated_at: new Date().toISOString() }, { onConflict: "key" });
    }

    // Update password
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }

      const { data: passwordRow } = await sb
        .from("admin_config")
        .select("value")
        .eq("key", "admin_password")
        .single();

      const currentHash = await sha256(body.currentPassword);
      const defaultHash = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
      const storedHash = passwordRow?.value || defaultHash;
      if (currentHash !== storedHash) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }

      const newHash = await sha256(body.newPassword);
      await sb
        .from("admin_config")
        .upsert({ key: "admin_password", value: newHash, updated_at: new Date().toISOString() }, { onConflict: "key" });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
