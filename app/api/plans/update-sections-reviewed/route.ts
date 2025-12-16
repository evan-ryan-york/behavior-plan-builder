import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { planId, sectionsReviewed } = await request.json();

    if (!planId || !Array.isArray(sectionsReviewed)) {
      return NextResponse.json(
        { error: "Missing required fields: planId, sectionsReviewed" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from("plans")
      .update({
        sections_reviewed: sectionsReviewed,
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error updating sections reviewed:", updateError);
      return NextResponse.json({ error: "Failed to update sections reviewed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating sections reviewed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update sections reviewed" },
      { status: 500 }
    );
  }
}
