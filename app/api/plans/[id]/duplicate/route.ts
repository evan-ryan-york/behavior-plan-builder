import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the original plan
  const { data: originalPlan, error: fetchError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !originalPlan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (originalPlan.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Create a new plan with copied content
  const { data: newPlan, error: insertError } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      student_id: originalPlan.student_id,
      status: "draft",
      target_behavior: originalPlan.target_behavior,
      behavior_frequency: originalPlan.behavior_frequency,
      behavior_intensity: originalPlan.behavior_intensity,
      assessment_responses: originalPlan.assessment_responses,
      function_scores: originalPlan.function_scores,
      calculated_function: originalPlan.calculated_function,
      determined_function: originalPlan.determined_function,
      secondary_function: originalPlan.secondary_function,
      whats_been_tried: originalPlan.whats_been_tried,
      implementer: originalPlan.implementer,
      // Copy generated content
      generated_function_summary: originalPlan.generated_function_summary,
      generated_replacement_behavior: originalPlan.generated_replacement_behavior,
      generated_prevention_strategies: originalPlan.generated_prevention_strategies,
      generated_reinforcement_plan: originalPlan.generated_reinforcement_plan,
      generated_response_to_behavior: originalPlan.generated_response_to_behavior,
      // Copy current content
      current_function_summary: originalPlan.current_function_summary,
      current_replacement_behavior: originalPlan.current_replacement_behavior,
      current_prevention_strategies: originalPlan.current_prevention_strategies,
      current_reinforcement_plan: originalPlan.current_reinforcement_plan,
      current_response_to_behavior: originalPlan.current_response_to_behavior,
      // Reset tracking fields
      generation_version: 1,
      sections_reviewed: [],
      finalized_at: null,
      revision_counts: {},
      // Don't copy sharing fields
      share_token: null,
      share_enabled: false,
      share_created_at: null,
    })
    .select()
    .single();

  if (insertError || !newPlan) {
    console.error("Error duplicating plan:", insertError);
    return NextResponse.json(
      { error: "Failed to duplicate plan" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: newPlan.id });
}
