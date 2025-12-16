import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { BehaviorPlanPdf } from "@/lib/pdf/behavior-plan-pdf";
import { functionInfo, BehaviorFunction, implementerOptions } from "@/lib/assessment-questions";

export async function GET(
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
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the plan with student data
  const { data: plan, error } = await supabase
    .from("plans")
    .select(
      `
      *,
      students (
        id,
        name,
        grade_level
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !plan) {
    return Response.json({ error: "Plan not found" }, { status: 404 });
  }

  const student = plan.students as {
    id: string;
    name: string;
    grade_level: string | null;
  } | null;

  // Parse prevention strategies
  let preventionStrategies: string[] = [];
  try {
    const parsed = JSON.parse(plan.current_prevention_strategies || "[]");
    preventionStrategies = Array.isArray(parsed) ? parsed : [];
  } catch {
    preventionStrategies = [];
  }

  // Parse implementers
  let implementers: string[] = [];
  try {
    const parsed = JSON.parse(plan.implementer || "[]");
    if (Array.isArray(parsed)) {
      implementers = parsed.map((imp: string) => {
        const option = implementerOptions.find((o) => o.value === imp);
        return option?.label || imp;
      });
    }
  } catch {
    if (plan.implementer) {
      const option = implementerOptions.find((o) => o.value === plan.implementer);
      implementers = [option?.label || plan.implementer];
    }
  }

  // Get function labels
  const primaryFunction = plan.determined_function
    ? functionInfo[plan.determined_function as BehaviorFunction]?.label || null
    : null;
  const secondaryFunction = plan.secondary_function
    ? functionInfo[plan.secondary_function as BehaviorFunction]?.label || null
    : null;

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    BehaviorPlanPdf({
      studentName: student?.name || "Unknown Student",
      gradeLevel: student?.grade_level || null,
      targetBehavior: plan.target_behavior,
      frequency: plan.behavior_frequency,
      intensity: plan.behavior_intensity,
      primaryFunction,
      secondaryFunction,
      functionSummary: plan.current_function_summary,
      replacementBehavior: plan.current_replacement_behavior,
      preventionStrategies,
      reinforcementPlan: plan.current_reinforcement_plan,
      responseToBehavior: plan.current_response_to_behavior,
      implementers,
      whatsTried: plan.whats_been_tried,
      createdAt: plan.created_at,
      finalizedAt: plan.finalized_at,
    })
  );

  // Generate filename
  const date = new Date().toISOString().split("T")[0];
  const safeName = (student?.name || "unknown")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  const filename = `behavior-plan-${safeName}-${date}.pdf`;

  // Convert Buffer to Uint8Array for Response compatibility
  const uint8Array = new Uint8Array(pdfBuffer);

  return new Response(uint8Array, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
