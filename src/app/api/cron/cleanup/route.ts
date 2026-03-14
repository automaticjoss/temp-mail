import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // Delete emails older than 24 hours
    const { data, error, count } = await supabase
      .from("emails")
      .delete()
      .lt("created_at", twentyFourHoursAgo.toISOString())
      .select("id");

    if (error) {
      console.error("Cleanup error:", error);
      return NextResponse.json(
        { error: "Failed to cleanup emails", details: error.message },
        { status: 500 }
      );
    }

    const deletedCount = data?.length || 0;
    
    console.log(`Cleanup completed: ${deletedCount} emails deleted`);

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      cutoff: twentyFourHoursAgo.toISOString(),
    });
  } catch (error) {
    console.error("Cleanup cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
