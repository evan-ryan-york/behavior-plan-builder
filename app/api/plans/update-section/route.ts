import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { planId, sectionName, content } = await request.json();

    if (!planId || !sectionName || content === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: planId, sectionName, content" },
        { status: 400 }
      );
    }

    // Validate section name
    const validSections = [
      "function_summary",
      "replacement_behavior",
      "prevention_strategies",
      "reinforcement_plan",
      "response_to_behavior",
    ];

    if (!validSections.includes(sectionName)) {
      return NextResponse.json({ error: "Invalid section name" }, { status: 400 });
    }

    const supabase = await createClient();

    // Update the current content for the section
    const updateField = `current_${sectionName}`;
    const { error: updateError } = await supabase
      .from("plans")
      .update({
        [updateField]: content,
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error updating section:", updateError);
      return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update section" },
      { status: 500 }
    );
  }
}
