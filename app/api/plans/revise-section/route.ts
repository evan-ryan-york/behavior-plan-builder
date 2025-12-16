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

// Function explanations for prompts
function getFunctionExplanation(func: BehaviorFunction): string {
  const explanations: Record<BehaviorFunction, string> = {
    escape: "escape or avoid tasks, demands, or situations they find difficult, boring, or unpleasant",
    attention: "get a response or interaction from others, whether positive or negative attention",
    access: "obtain items, activities, or privileges they want",
    sensory: "experience sensory input or internal stimulation, regardless of external factors",
  };
  return explanations[func] || "meet an underlying need";
}

// Build section-specific prompts
function buildSectionPrompt(
  sectionName: PlanSection,
  student: { name: string; grade_level: string | null; interests: string | null },
  plan: {
    target_behavior: string | null;
    determined_function: string | null;
    secondary_function: string | null;
    current_replacement_behavior: string | null;
    whats_been_tried: string | null;
    implementer: string | null;
  },
  currentContent: string,
  userFeedback: string
): string {
  const determinedFunction = plan.determined_function as BehaviorFunction;
  const secondaryFunction = plan.secondary_function as BehaviorFunction | null;
  const functionLabel = determinedFunction ? functionInfo[determinedFunction]?.label : "Not determined";
  const functionExplanation = determinedFunction ? getFunctionExplanation(determinedFunction) : "meet an underlying need";

  // Parse implementers
  let implementersDisplay = "classroom staff";
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

  // Multiple functions text
  let multipleFunctionsNote = "";
  if (secondaryFunction) {
    multipleFunctionsNote = `
Note: This behavior serves multiple functions (${functionLabel} and ${functionInfo[secondaryFunction]?.label}). Consider both when revising.`;
  }

  // Section-specific prompts
  const prompts: Record<PlanSection, string> = {
    replacement_behavior: `You are revising the Replacement Behavior section of a behavior intervention plan.

The replacement behavior must:
- Serve the same function as the target behavior (${functionLabel} - to ${functionExplanation})
- Be easier or as easy as the target behavior
- Be age-appropriate for a ${student.grade_level || "school-age"} student
- Be specific, observable, and teachable
- Be realistic given what we know about the student
${multipleFunctionsNote}

STUDENT CONTEXT:
Name: ${student.name}
Grade: ${student.grade_level || "Not specified"}
Interests: ${student.interests || "Not specified"}
Target behavior: ${plan.target_behavior || "Not specified"}

CURRENT REPLACEMENT BEHAVIOR:
${currentContent}

USER FEEDBACK:
${userFeedback}

Revise the replacement behavior based on this feedback. Return 3-4 bullet points describing ONE replacement behavior (what it is, when to use it, how to teach it).

Use **bold** for key terms. Keep each bullet to 1-2 sentences max.`,

    prevention_strategies: `You are revising the Prevention Strategies section of a behavior intervention plan.

Prevention strategies should:
- Address the antecedents/triggers for the behavior
- Be proactive (happen BEFORE the behavior occurs)
- Be realistic for ${implementersDisplay} to implement
- NOT include things already tried: ${plan.whats_been_tried || "Nothing specified"}
${multipleFunctionsNote}

STUDENT CONTEXT:
Name: ${student.name}
Grade: ${student.grade_level || "Not specified"}
Target behavior: ${plan.target_behavior || "Not specified"}

BEHAVIOR FUNCTION:
${functionLabel} - The student engages in this behavior to ${functionExplanation}.

CURRENT PREVENTION STRATEGIES:
${currentContent}

USER FEEDBACK:
${userFeedback}

Revise the prevention strategies based on this feedback. Return EXACTLY 3 strategies.
Each strategy must have a **bold title** followed by 1-2 sentences of explanation.`,

    reinforcement_plan: `You are revising the Reinforcement Plan section of a behavior intervention plan.

The reinforcement plan should:
- Reinforce the replacement behavior: ${plan.current_replacement_behavior || "See replacement behavior section"}
- Use reinforcers that motivate this specific student
- Student interests: ${student.interests || "Not specified"}
- Include a realistic schedule for ${implementersDisplay}
- Include a plan for fading reinforcement over time
${multipleFunctionsNote}

STUDENT CONTEXT:
Name: ${student.name}
Grade: ${student.grade_level || "Not specified"}

CURRENT REINFORCEMENT PLAN:
${currentContent}

USER FEEDBACK:
${userFeedback}

Revise the reinforcement plan based on this feedback.
Return 3-4 items using **bold title** - explanation format.
Keep each item to 1-2 sentences.`,

    response_to_behavior: `You are revising the Response to Target Behavior section of a behavior intervention plan.

The response should:
- NOT reinforce the target behavior (which is ${functionLabel}-maintained)
- Redirect to the replacement behavior: ${plan.current_replacement_behavior || "See replacement behavior section"}
- Be calm, consistent, and realistic to implement
- Include specific steps for ${implementersDisplay}
${multipleFunctionsNote}

STUDENT CONTEXT:
Name: ${student.name}
Target behavior: ${plan.target_behavior || "Not specified"}

CURRENT RESPONSE:
${currentContent}

USER FEEDBACK:
${userFeedback}

Revise the response strategies based on this feedback.
Return EXACTLY 3 numbered steps (1. 2. 3.), each 1-2 sentences.`,
  };

  return prompts[sectionName] + `

Also provide a brief (1-2 sentence) behavior science rationale explaining WHY these recommendations are appropriate. Reference specific ABA/behavior science concepts such as:
- Functional equivalence, response effort, functional communication training
- Antecedent interventions, abolishing operations, setting events
- Schedules of reinforcement, differential reinforcement (DRA, DRI, DRO), fading
- Extinction, planned ignoring, redirection`;
}

export async function POST(request: Request) {
  try {
    const { planId, sectionName, currentContent, userFeedback, isManualEdit } = await request.json();

    if (!planId || !sectionName || !currentContent) {
      return NextResponse.json(
        { error: "Missing required fields: planId, sectionName, currentContent" },
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

    // Handle manual edit
    if (isManualEdit) {
      // For manual edits, just save the content directly
      const updateField = `current_${sectionName}`;
      const { error: updateError } = await supabase
        .from("plans")
        .update({
          [updateField]: currentContent,
        })
        .eq("id", planId);

      if (updateError) {
        console.error("Error updating plan:", updateError);
        return NextResponse.json({ error: "Failed to save manual edit" }, { status: 500 });
      }

      // Create revision record for manual edit
      const { data: latestRevision } = await supabase
        .from("plan_section_revisions")
        .select("revision_number")
        .eq("plan_id", planId)
        .eq("section_name", sectionName)
        .eq("generation_version", plan.generation_version)
        .order("revision_number", { ascending: false })
        .limit(1)
        .single();

      const nextRevisionNumber = latestRevision ? latestRevision.revision_number + 1 : 1;

      await supabase.from("plan_section_revisions").insert({
        plan_id: planId,
        section_name: sectionName,
        content: currentContent,
        revision_number: nextRevisionNumber,
        generation_version: plan.generation_version,
        feedback_given: "Manual edit",
        is_manual_edit: true,
      });

      // Update revision counts
      const revisionCounts = plan.revision_counts || {};
      revisionCounts[sectionName] = (revisionCounts[sectionName] || 0) + 1;
      await supabase
        .from("plans")
        .update({ revision_counts: revisionCounts })
        .eq("id", planId);

      return NextResponse.json({
        success: true,
        revisedContent: sectionName === "prevention_strategies"
          ? JSON.parse(currentContent)
          : currentContent,
        rationale: "Content was manually edited.",
        isManualEdit: true,
      });
    }

    // AI revision requires user feedback
    if (!userFeedback) {
      return NextResponse.json(
        { error: "User feedback is required for AI revision" },
        { status: 400 }
      );
    }

    // Build the section-specific prompt
    const prompt = buildSectionPrompt(
      sectionName as PlanSection,
      student,
      plan,
      currentContent,
      userFeedback
    );

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

    // Update revision counts
    const revisionCounts = plan.revision_counts || {};
    revisionCounts[sectionName] = (revisionCounts[sectionName] || 0) + 1;

    const { error: updateError } = await supabase
      .from("plans")
      .update({
        [updateField]: revisedContent,
        revision_counts: revisionCounts,
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error updating plan:", updateError);
      return NextResponse.json({ error: "Failed to save revised content" }, { status: 500 });
    }

    // Create revision record
    const { data: latestRevision } = await supabase
      .from("plan_section_revisions")
      .select("revision_number")
      .eq("plan_id", planId)
      .eq("section_name", sectionName)
      .eq("generation_version", plan.generation_version)
      .order("revision_number", { ascending: false })
      .limit(1)
      .single();

    const nextRevisionNumber = latestRevision ? latestRevision.revision_number + 1 : 1;

    await supabase.from("plan_section_revisions").insert({
      plan_id: planId,
      section_name: sectionName,
      content: revisedContent,
      revision_number: nextRevisionNumber,
      generation_version: plan.generation_version,
      feedback_given: userFeedback,
      is_manual_edit: false,
    });

    return NextResponse.json({
      success: true,
      revisedContent: responseContent,
      rationale: object.rationale,
      revisionNumber: nextRevisionNumber,
    });
  } catch (error) {
    console.error("Error revising section:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revise section" },
      { status: 500 }
    );
  }
}
