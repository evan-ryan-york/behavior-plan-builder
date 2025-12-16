import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
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

Revise this section based on the user's feedback. Keep it CONCISE. Use the student's name where appropriate.

CRITICAL: Keep content SHORT and scannable. Educators need quick-reference content.

FORMATTING RULES:
- Use **bold** for key terms only
- Use bullet points (-) for lists
- Use numbered lists (1. 2. 3.) for sequential steps
- DO NOT use headers (## or ###) - section titles are already provided
- Keep each bullet point to 1-2 sentences max

${sectionName === "prevention_strategies"
  ? "Return exactly 3 strategies. Each strategy should have a **bold title** followed by 1-2 sentences."
  : sectionName === "response_to_behavior"
    ? "Return exactly 3 numbered steps (1. 2. 3.), each 1-2 sentences."
    : sectionName === "replacement_behavior"
      ? "Return 3-4 bullet points max describing ONE replacement behavior."
      : sectionName === "reinforcement_plan"
        ? "Return 3-4 items using **bold title** - explanation format."
        : "Return the revised content."}

Also provide a brief (1-2 sentence) behavior science rationale explaining WHY these recommendations are appropriate. Reference ABA concepts like functional equivalence, antecedent interventions, differential reinforcement, extinction, etc.`;

    // Define schema based on section type
    const schema = sectionName === "prevention_strategies"
      ? z.object({
          content: z.array(z.string()).min(3).max(3).describe("Exactly 3 prevention strategies"),
          rationale: z.string().describe("1-2 sentence behavior science rationale"),
        })
      : z.object({
          content: z.string().describe("The revised section content"),
          rationale: z.string().describe("1-2 sentence behavior science rationale"),
        });

    // Generate the revised content with rationale
    const { object } = await generateObject({
      model: getAnthropic()(DEFAULT_MODEL),
      schema,
      prompt,
    });

    // Process content for storage
    let revisedContent: string;
    let responseContent: string | string[];

    if (sectionName === "prevention_strategies") {
      const strategies = (object as { content: string[]; rationale: string }).content;
      revisedContent = JSON.stringify(strategies);
      responseContent = strategies;
    } else {
      revisedContent = (object as { content: string; rationale: string }).content;
      responseContent = revisedContent;
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

    return NextResponse.json({
      success: true,
      revisedContent: responseContent,
      rationale: object.rationale,
    });
  } catch (error) {
    console.error("Error revising section:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revise section" },
      { status: 500 }
    );
  }
}
