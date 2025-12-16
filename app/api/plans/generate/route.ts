import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getAnthropic, DEFAULT_MODEL } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { functionInfo, BehaviorFunction } from "@/lib/assessment-questions";

// Schema for the generated plan content
const planSchema = z.object({
  function_summary: z.string().describe("2-3 sentence explanation of why the student engages in this behavior based on the function assessment"),
  replacement_behavior: z.string().describe("A specific, teachable replacement behavior that serves the same function"),
  prevention_strategies: z.array(z.string()).min(3).max(5).describe("3-5 proactive strategies to prevent the target behavior"),
  reinforcement_plan: z.string().describe("Detailed reinforcement plan including what reinforcers to use, schedule, and fading plan"),
  response_to_behavior: z.string().describe("Step-by-step guide for how to respond when the target behavior occurs"),
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

Generate a behavior intervention plan with the following sections. Be specific, practical, and tailor everything to this specific student. Use the student's name throughout. Avoid suggesting strategies that have already been tried unless you're suggesting a modification.

Important guidelines:
- For the replacement behavior: It must be functionally equivalent (meets the same need), easier or as easy as the target behavior, age-appropriate, and teachable.
- For prevention strategies: Focus on antecedent modifications—changes to the environment, routines, or demands that reduce the likelihood of the behavior.
- For the reinforcement plan: Use the student's interests as reinforcers when possible. Include how often to reinforce and how to fade over time.
- For response to target behavior: Ensure the response doesn't accidentally reinforce the behavior and redirects to the replacement behavior.`;

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
        prevention_strategies: object.prevention_strategies,
        reinforcement_plan: object.reinforcement_plan,
        response_to_behavior: object.response_to_behavior,
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
