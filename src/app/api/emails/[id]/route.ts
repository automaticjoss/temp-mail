import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing email id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("emails").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
