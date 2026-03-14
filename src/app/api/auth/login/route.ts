import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Default fallback: admin / admin
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    let expectedUsername = DEFAULT_USERNAME;
    let expectedPasswordHash = DEFAULT_PASSWORD_HASH;

    // Try to read from DB, fallback to defaults if table doesn't exist
    try {
      const sb = createServiceClient();

      const { data: usernameRow } = await sb
        .from("admin_config")
        .select("value")
        .eq("key", "admin_username")
        .single();

      const { data: passwordRow } = await sb
        .from("admin_config")
        .select("value")
        .eq("key", "admin_password")
        .single();

      if (usernameRow) expectedUsername = usernameRow.value;
      if (passwordRow) expectedPasswordHash = passwordRow.value;
    } catch {
      // Table doesn't exist yet — use defaults
    }

    const passwordHash = await sha256(password);

    if (username === expectedUsername && passwordHash === expectedPasswordHash) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
