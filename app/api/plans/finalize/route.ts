import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Update the plan status to complete with finalized_at timestamp
    const { data: plan, error: updateError } = await supabase
      .from("plans")
      .update({
        status: "complete",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Error finalizing plan:", updateError);
      return NextResponse.json({ error: "Failed to finalize plan" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Error finalizing plan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to finalize plan" },
      { status: 500 }
    );
  }
}
