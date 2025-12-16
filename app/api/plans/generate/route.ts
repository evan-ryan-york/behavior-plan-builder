import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getAnthropic, DEFAULT_MODEL } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { functionInfo, BehaviorFunction } from "@/lib/assessment-questions";

// Schema for the generated plan content
const planSchema = z.object({
  function_summary: z.string().describe("2-3 sentence explanation of why the student engages in this behavior based on the function assessment."),
  replacement_behavior: z.string().describe("Brief description of ONE specific replacement behavior: what it is, when to use it, and how to teach it. Keep to 3-4 short bullet points max."),
  replacement_behavior_rationale: z.string().describe("1-2 sentence behavior science rationale explaining why this replacement behavior was chosen (e.g., functional equivalence, response effort, etc.)"),
  prevention_strategies: z.array(z.string()).min(3).max(3).describe("Exactly 3 prevention strategies. Each strategy should be a bold title followed by 1-2 sentences of explanation."),
  prevention_strategies_rationale: z.string().describe("1-2 sentence behavior science rationale explaining the antecedent intervention approach (e.g., abolishing operations, setting events, discriminative stimuli)."),
  reinforcement_plan: z.string().describe("Concise reinforcement plan with 3-4 items. Each item should have a **bold title** followed by 1-2 sentences of explanation, same format as prevention strategies."),
  reinforcement_plan_rationale: z.string().describe("1-2 sentence behavior science rationale explaining the reinforcement strategy (e.g., schedule of reinforcement, differential reinforcement, fading procedures)."),
  response_to_behavior: z.string().describe("Exactly 3 numbered steps for responding when the behavior occurs. Keep each step to 1-2 sentences."),
  response_to_behavior_rationale: z.string().describe("1-2 sentence behavior science rationale explaining why this response protocol avoids reinforcing the target behavior (e.g., extinction, redirection, planned ignoring)."),
});

export type GeneratedPlan = z.infer<typeof planSchema>;

// Function explanations based on determined function
function getFunctionExplanation(func: BehaviorFunction): string {
  const explanations: Record<BehaviorFunction, string> = {
    escape: "escape or avoid tasks, demands, or situations they find difficult, boring, or unpleasant",
    attention: "get a response or interaction from others, whether positive or negative attention",
    access: "obtain items, activities, or privileges they want",
    sensory: "experience sensory input or internal stimulation, regardless of external factors",
  };
  return explanations[func] || "meet an underlying need";
}

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
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

    // Build the function scores display
    const functionScores = plan.function_scores || {};
    const functionScoreDisplay = Object.entries(functionScores)
      .map(([func, score]) => {
        const label = functionInfo[func as BehaviorFunction]?.label || func;
        const scoreDisplay = score !== null && score !== undefined
          ? (score as number).toFixed(2)
          : "N/A";
        return `${label}: ${scoreDisplay}`;
      })
      .join(", ");

    const determinedFunction = plan.determined_function as BehaviorFunction;
    const functionExplanation = determinedFunction
      ? getFunctionExplanation(determinedFunction)
      : "meet an underlying need";

    // Parse implementers
    let implementersDisplay = "Not specified";
    if (plan.implementer) {
      try {
        const implementers = JSON.parse(plan.implementer);
        if (Array.isArray(implementers) && implementers.length > 0) {
          implementersDisplay = implementers
            .map((impl: string) =>
              impl.startsWith("Other: ")
                ? impl.replace("Other: ", "")
                : impl.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
            )
            .join(", ");
        }
      } catch {
        implementersDisplay = plan.implementer;
      }
    }

    // Construct the prompt
    const prompt = `You are an expert behavior analyst helping create a behavior intervention plan for a student.

STUDENT INFORMATION:
Name: ${student.name}
Grade: ${student.grade_level || "Not specified"}
About this student: ${student.about || "Not specified"}
Interests and motivators: ${student.interests || "Not specified"}

BEHAVIOR INFORMATION:
Target behavior: ${plan.target_behavior || "Not specified"}
Frequency: ${plan.behavior_frequency || "Not specified"}
Intensity: ${plan.behavior_intensity || "Not specified"}

FUNCTION ASSESSMENT RESULTS:
Primary function: ${determinedFunction ? functionInfo[determinedFunction]?.label : "Not determined"}
Function scores: ${functionScoreDisplay || "Not available"}
This means the student likely engages in this behavior to ${functionExplanation}.

ADDITIONAL CONTEXT:
Strategies already tried: ${plan.whats_been_tried || "None specified"}
Plan will be implemented by: ${implementersDisplay}

Generate a CONCISE behavior intervention plan. Be specific and practical. Use the student's name. Avoid strategies already tried.

CRITICAL: Keep each section SHORT and scannable. Educators need quick-reference content, not lengthy explanations.

FORMATTING RULES:
- Use **bold** for key terms only
- Use bullet points (-) for lists
- Use numbered lists (1. 2. 3.) for sequential steps
- DO NOT use headers (## or ###) within sections - the section titles are already provided
- Keep each bullet point to 1-2 sentences max

SECTION REQUIREMENTS:
- Function Summary: 2-3 sentences only
- Replacement Behavior: ONE specific behavior with 3-4 bullet points (what it is, when to use, how to teach)
- Prevention Strategies: Exactly 3 strategies, each with a **bold title** and 1-2 sentence explanation
- Reinforcement Plan: 3-4 items using same format as Prevention Strategies (**bold title** - explanation)
- Response to Behavior: Exactly 3 numbered steps (1. 2. 3.), each 1-2 sentences

RATIONALE REQUIREMENTS:
For each editable section, provide a brief (1-2 sentence) behavior science rationale explaining WHY you made these recommendations. Reference specific ABA/behavior science concepts such as:
- Functional equivalence, response effort, functional communication training
- Antecedent interventions, abolishing operations, establishing operations, setting events
- Schedules of reinforcement, differential reinforcement (DRA, DRI, DRO), fading
- Extinction, extinction bursts, planned ignoring, response blocking

Guidelines:
- Replacement behavior must be functionally equivalent and easier than the target behavior
- Prevention strategies should focus on antecedent modifications
- Use the student's interests as reinforcers
- Response steps should not accidentally reinforce the behavior`;

    // Generate the plan content using Vercel AI SDK
    const { object } = await generateObject({
      model: getAnthropic()(DEFAULT_MODEL),
      schema: planSchema,
      prompt,
    });

    // Convert prevention strategies array to JSON string for storage
    const preventionStrategiesJson = JSON.stringify(object.prevention_strategies);

    // Update the plan with generated content
    const { error: updateError } = await supabase
      .from("plans")
      .update({
        generated_function_summary: object.function_summary,
        generated_replacement_behavior: object.replacement_behavior,
        generated_prevention_strategies: preventionStrategiesJson,
        generated_reinforcement_plan: object.reinforcement_plan,
        generated_response_to_behavior: object.response_to_behavior,
        current_function_summary: object.function_summary,
        current_replacement_behavior: object.replacement_behavior,
        current_prevention_strategies: preventionStrategiesJson,
        current_reinforcement_plan: object.reinforcement_plan,
        current_response_to_behavior: object.response_to_behavior,
        status: "generating",
        sections_reviewed: [],
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error updating plan:", updateError);
      return NextResponse.json({ error: "Failed to save generated plan" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plan: {
        function_summary: object.function_summary,
        replacement_behavior: object.replacement_behavior,
        replacement_behavior_rationale: object.replacement_behavior_rationale,
        prevention_strategies: object.prevention_strategies,
        prevention_strategies_rationale: object.prevention_strategies_rationale,
        reinforcement_plan: object.reinforcement_plan,
        reinforcement_plan_rationale: object.reinforcement_plan_rationale,
        response_to_behavior: object.response_to_behavior,
        response_to_behavior_rationale: object.response_to_behavior_rationale,
      },
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate plan" },
      { status: 500 }
    );
  }
}
