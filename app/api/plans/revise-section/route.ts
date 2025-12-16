import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getAnthropic, DEFAULT_MODEL } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { functionInfo, BehaviorFunction } from "@/lib/assessment-questions";

// Section name type for type safety
export type PlanSection =
  | "replacement_behavior"
  | "prevention_strategies"
  | "reinforcement_plan"
  | "response_to_behavior";

// Map section names to display names
const sectionDisplayNames: Record<PlanSection, string> = {
  replacement_behavior: "Replacement Behavior",
  prevention_strategies: "Prevention Strategies",
  reinforcement_plan: "Reinforcement Plan",
  response_to_behavior: "Response to Target Behavior",
};

export async function POST(request: Request) {
  try {
    const { planId, sectionName, currentContent, userFeedback } = await request.json();

    if (!planId || !sectionName || !currentContent || !userFeedback) {
      return NextResponse.json(
        { error: "Missing required fields: planId, sectionName, currentContent, userFeedback" },
        { status: 400 }
      );
    }

    // Validate section name
    if (!["replacement_behavior", "prevention_strategies", "reinforcement_plan", "response_to_behavior"].includes(sectionName)) {
      return NextResponse.json({ error: "Invalid section name" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch the plan and associated student data
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select(`
        *,
        students (*)
      `)
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const student = plan.students;

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const determinedFunction = plan.determined_function as BehaviorFunction;

    // Parse prevention strategies for display if stored as JSON
    let preventionStrategies = plan.current_prevention_strategies;
    try {
      const parsed = JSON.parse(preventionStrategies || "[]");
      if (Array.isArray(parsed)) {
        preventionStrategies = parsed.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
      }
    } catch {
      // Keep as is if not JSON
    }

    // Construct the revision prompt
    const prompt = `You are an expert behavior analyst revising one section of a behavior intervention plan.

CONTEXT:
Student: ${student.name}, Grade: ${student.grade_level || "Not specified"}
Target behavior: ${plan.target_behavior || "Not specified"}
Primary function: ${determinedFunction ? functionInfo[determinedFunction]?.label : "Not determined"}
Student interests: ${student.interests || "Not specified"}

CURRENT PLAN SECTIONS (for coherence):
Function Summary: ${plan.current_function_summary || "Not generated yet"}
Replacement Behavior: ${plan.current_replacement_behavior || "Not generated yet"}
Prevention Strategies: ${preventionStrategies || "Not generated yet"}
Reinforcement Plan: ${plan.current_reinforcement_plan || "Not generated yet"}
Response to Behavior: ${plan.current_response_to_behavior || "Not generated yet"}

You are revising the "${sectionDisplayNames[sectionName as PlanSection]}" section.

CURRENT CONTENT:
${currentContent}

USER FEEDBACK:
${userFeedback}

Revise this section based on the user's feedback. Keep it consistent with the rest of the plan. Maintain the same level of specificity and professionalism. Use the student's name where appropriate.

${sectionName === "prevention_strategies" ? "Return the strategies as a JSON array of strings, with each strategy as a separate item." : "Return ONLY the revised content for this section, no additional commentary or explanation."}`;

    // Generate the revised content
    const { text } = await generateText({
      model: getAnthropic()(DEFAULT_MODEL),
      prompt,
    });

    // Clean up the response - remove any markdown or extra formatting
    let revisedContent = text.trim();

    // For prevention strategies, try to parse as JSON array
    if (sectionName === "prevention_strategies") {
      try {
        // Try to extract JSON array from the response
        const jsonMatch = revisedContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            revisedContent = JSON.stringify(parsed);
          }
        }
      } catch {
        // If parsing fails, try to convert numbered list to array
        const lines = revisedContent.split("\n").filter(line => line.trim());
        const strategies = lines.map(line => line.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
        if (strategies.length > 0) {
          revisedContent = JSON.stringify(strategies);
        }
      }
    }

    // Update the plan with revised content
    const updateField = `current_${sectionName}`;
    const { error: updateError } = await supabase
      .from("plans")
      .update({
        [updateField]: revisedContent,
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error updating plan:", updateError);
      return NextResponse.json({ error: "Failed to save revised content" }, { status: 500 });
    }

    // For prevention strategies, return as array for the UI
    let responseContent = revisedContent;
    if (sectionName === "prevention_strategies") {
      try {
        responseContent = JSON.parse(revisedContent);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    return NextResponse.json({
      success: true,
      revisedContent: responseContent,
    });
  } catch (error) {
    console.error("Error revising section:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revise section" },
      { status: 500 }
    );
  }
}
