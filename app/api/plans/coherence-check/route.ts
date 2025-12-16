import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getAnthropic, DEFAULT_MODEL } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

// Schema for coherence check response
const coherenceSchema = z.object({
  replacement_behavior: z.object({
    coherent: z.boolean(),
    issue: z.string().optional(),
    suggestion: z.string().optional(),
  }),
  prevention_strategies: z.object({
    coherent: z.boolean(),
    issue: z.string().optional(),
    suggestion: z.string().optional(),
  }),
  reinforcement_plan: z.object({
    coherent: z.boolean(),
    issue: z.string().optional(),
    suggestion: z.string().optional(),
  }),
  response_to_behavior: z.object({
    coherent: z.boolean(),
    issue: z.string().optional(),
    suggestion: z.string().optional(),
  }),
});

export type CoherenceCheckResult = z.infer<typeof coherenceSchema>;

export async function POST(request: Request) {
  try {
    const { planId, revisedSection } = await request.json();

    if (!planId || !revisedSection) {
      return NextResponse.json(
        { error: "Plan ID and revised section name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the plan with current content
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Parse prevention strategies
    let preventionStrategies = plan.current_prevention_strategies;
    try {
      const parsed = JSON.parse(preventionStrategies || "[]");
      if (Array.isArray(parsed)) {
        preventionStrategies = parsed.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
      }
    } catch {
      // Keep as is if not JSON
    }

    // Construct the coherence check prompt
    const prompt = `You are reviewing a behavior intervention plan for internal consistency.

PLAN SECTIONS:

Function Summary: ${plan.current_function_summary || "Not set"}

Replacement Behavior: ${plan.current_replacement_behavior || "Not set"}

Prevention Strategies: ${preventionStrategies || "Not set"}

Reinforcement Plan: ${plan.current_reinforcement_plan || "Not set"}

Response to Behavior: ${plan.current_response_to_behavior || "Not set"}

The "${revisedSection}" section was just revised.

Check if the OTHER sections are still coherent with this change. For each section, determine if it needs updating to maintain consistency with the revised section.

Consider these coherence issues:
- If replacement_behavior changed, reinforcement_plan should reinforce the NEW replacement behavior
- If replacement_behavior changed, response_to_behavior should redirect to the NEW replacement behavior
- If prevention_strategies changed significantly, response steps might need adjustment
- If reinforcement_plan mentions specific behaviors, they should match current replacement_behavior

For each section (EXCEPT the one that was just revised), respond with whether it's coherent.
If a section has an issue, provide a brief description and a suggestion for how to fix it.`;

    // Generate the coherence check using AI
    const { object } = await generateObject({
      model: getAnthropic()(DEFAULT_MODEL),
      schema: coherenceSchema,
      prompt,
    });

    // Mark the revised section as coherent (it was just updated)
    const result = { ...object };
    const sectionKey = revisedSection.replace("current_", "") as keyof CoherenceCheckResult;
    if (sectionKey in result) {
      result[sectionKey] = { coherent: true };
    }

    // Check if any issues were found
    const hasIssues = Object.entries(result).some(
      ([key, value]) =>
        key !== revisedSection.replace("current_", "") && !value.coherent
    );

    return NextResponse.json({
      success: true,
      hasIssues,
      coherenceCheck: result,
    });
  } catch (error) {
    console.error("Error performing coherence check:", error);
    // Return success with no issues on error - don't block the user
    return NextResponse.json({
      success: true,
      hasIssues: false,
      coherenceCheck: null,
      error: error instanceof Error ? error.message : "Coherence check failed",
    });
  }
}
