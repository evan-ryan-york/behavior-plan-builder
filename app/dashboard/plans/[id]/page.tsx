import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { functionInfo, BehaviorFunction, implementerOptions } from "@/lib/assessment-questions";
import { ExportDropdown } from "@/components/export-dropdown";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getStatusBadgeStyles(status: string) {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress":
    case "assessment_complete":
    case "generating":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "draft":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "assessment_complete":
      return "Assessment Done";
    case "generating":
      return "Generating";
    case "complete":
      return "Complete";
    case "draft":
    default:
      return "Draft";
  }
}

function formatFrequency(frequency: string | null) {
  if (!frequency) return "Not specified";
  const map: Record<string, string> = {
    multiple_daily: "Multiple times per day",
    once_daily: "About once per day",
    few_weekly: "A few times per week",
    once_weekly: "About once per week",
    less_weekly: "Less than once per week",
  };
  return map[frequency] || frequency;
}

function formatIntensity(intensity: string | null) {
  if (!intensity) return "Not specified";
  const map: Record<string, string> = {
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
    safety_concern: "Safety concern",
  };
  return map[intensity] || intensity;
}

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatFullDate(dateString: string | null) {
  if (!dateString) return "Not specified";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatImplementers(implementer: string | null): string[] {
  if (!implementer) return [];
  try {
    const parsed = JSON.parse(implementer);
    if (Array.isArray(parsed)) {
      return parsed.map((imp: string) => {
        const option = implementerOptions.find((o) => o.value === imp);
        return option?.label || imp;
      });
    }
  } catch {
    // If not JSON, return as single item
    const option = implementerOptions.find((o) => o.value === implementer);
    return [option?.label || implementer];
  }
  return [];
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan, error } = await supabase
    .from("plans")
    .select(
      `
      *,
      students (
        id,
        name,
        grade_level,
        about,
        interests
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !plan) {
    notFound();
  }

  const student = plan.students as {
    id: string;
    name: string;
    grade_level: string | null;
    about: string | null;
    interests: string | null;
  } | null;

  const determinedFunction = plan.determined_function as BehaviorFunction | null;
  const secondaryFunction = plan.secondary_function as BehaviorFunction | null;

  // Parse prevention strategies if stored as JSON
  let preventionStrategies: string[] = [];
  try {
    const parsed = JSON.parse(plan.current_prevention_strategies || "[]");
    preventionStrategies = Array.isArray(parsed) ? parsed : [];
  } catch {
    preventionStrategies = [];
  }

  const implementers = formatImplementers(plan.implementer);
  const isComplete = plan.status === "complete";

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <Link
          href="/dashboard/plans"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Plans
        </Link>
        <div className="flex items-center gap-2">
          {!isComplete && student && (
            <Button asChild variant="outline">
              <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
                Continue
              </Link>
            </Button>
          )}
          {isComplete && (
            <>
              <Button asChild variant="outline">
                <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
                  Edit
                </Link>
              </Button>
              <ExportDropdown
                planId={plan.id}
                studentName={student?.name || "Unknown"}
                shareToken={plan.share_token}
                shareEnabled={plan.share_enabled}
              />
            </>
          )}
        </div>
      </div>

      {/* Plan Title */}
      <div className="text-center mb-8 print:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 print:text-2xl">
          BEHAVIOR INTERVENTION PLAN
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground">
          <span className="font-medium text-foreground">
            Student: {student?.name || "Unknown Student"}
          </span>
          {student?.grade_level && (
            <>
              <span>|</span>
              <span>Grade: {student.grade_level}</span>
            </>
          )}
          {plan.finalized_at && (
            <>
              <span>|</span>
              <span>Date: {formatDate(plan.finalized_at)}</span>
            </>
          )}
        </div>
        {!isComplete && (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-3",
              getStatusBadgeStyles(plan.status)
            )}
          >
            {formatStatus(plan.status)}
          </span>
        )}
      </div>

      {/* Incomplete Plan Message */}
      {!isComplete && (
        <Card className="border-dashed mb-8">
          <CardContent className="py-8 text-center">
            <div className="mb-4">
              <svg
                className="h-12 w-12 mx-auto text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Plan In Progress</h3>
            <p className="text-muted-foreground text-sm mb-4">
              This plan is still being created. Continue to complete the plan
              and generate strategies.
            </p>
            {student && (
              <Button asChild>
                <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
                  Continue Plan
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Content */}
      <div className="space-y-6 print:space-y-4">
        {/* Target Behavior */}
        <Card className="print:shadow-none print:border-gray-300">
          <CardContent className="p-6 print:p-4">
            <h2 className="text-lg font-semibold mb-3 text-primary print:text-black">
              TARGET BEHAVIOR
            </h2>
            <p className="whitespace-pre-wrap mb-4">
              {plan.target_behavior || "Not specified"}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">Frequency:</span>{" "}
                {formatFrequency(plan.behavior_frequency)}
              </span>
              <span>
                <span className="font-medium text-foreground">Intensity:</span>{" "}
                {formatIntensity(plan.behavior_intensity)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Function of Behavior */}
        {(determinedFunction || plan.current_function_summary) && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardContent className="p-6 print:p-4">
              <h2 className="text-lg font-semibold mb-3 text-primary print:text-black">
                FUNCTION OF BEHAVIOR
              </h2>
              {determinedFunction && (
                <p className="text-sm mb-3">
                  <span className="font-medium">Primary Function:</span>{" "}
                  {functionInfo[determinedFunction]?.label}
                  {secondaryFunction && (
                    <>
                      {" "}
                      | <span className="font-medium">Secondary:</span>{" "}
                      {functionInfo[secondaryFunction]?.label}
                    </>
                  )}
                </p>
              )}
              {plan.current_function_summary && (
                <div className="prose prose-sm max-w-none text-muted-foreground print:text-black">
                  <Markdown>{plan.current_function_summary}</Markdown>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Replacement Behavior */}
        {plan.current_replacement_behavior && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardContent className="p-6 print:p-4">
              <h2 className="text-lg font-semibold mb-3 text-primary print:text-black">
                REPLACEMENT BEHAVIOR
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground print:text-black">
                <Markdown>{plan.current_replacement_behavior}</Markdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prevention Strategies */}
        {preventionStrategies.length > 0 && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardContent className="p-6 print:p-4">
              <h2 className="text-lg font-semibold mb-3 text-primary print:text-black">
                PREVENTION STRATEGIES
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground print:text-black">
                <Markdown>{preventionStrategies.join("\n\n")}</Markdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reinforcement Plan */}
        {plan.current_reinforcement_plan && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardContent className="p-6 print:p-4">
              <h2 className="text-lg font-semibold mb-3 text-primary print:text-black">
                REINFORCEMENT PLAN
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground print:text-black">
                <Markdown>{plan.current_reinforcement_plan}</Markdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response to Target Behavior */}
        {plan.current_response_to_behavior && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardContent className="p-6 print:p-4">
              <h2 className="text-lg font-semibold mb-3 text-primary print:text-black">
                RESPONSE TO TARGET BEHAVIOR
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground print:text-black">
                <Markdown>{plan.current_response_to_behavior}</Markdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Details */}
        <Card className="bg-muted/30 print:shadow-none print:border-gray-300 print:bg-gray-50">
          <CardContent className="p-6 print:p-4">
            <h2 className="text-lg font-semibold mb-3 text-primary print:text-black">
              PLAN DETAILS
            </h2>
            <div className="grid gap-3 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Created:</span>{" "}
                  {formatFullDate(plan.created_at)}
                </span>
                {plan.finalized_at && (
                  <span>
                    <span className="font-medium text-foreground">Finalized:</span>{" "}
                    {formatFullDate(plan.finalized_at)}
                  </span>
                )}
              </div>

              {implementers.length > 0 && (
                <div>
                  <span className="font-medium text-foreground">Implementers:</span>{" "}
                  <span className="text-muted-foreground">
                    {implementers.join(", ")}
                  </span>
                </div>
              )}

              {plan.whats_been_tried && (
                <div>
                  <span className="font-medium text-foreground">Previously Tried:</span>{" "}
                  <span className="text-muted-foreground">
                    {plan.whats_been_tried}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section (for printing) */}
        <Card className="hidden print:block print:shadow-none print:border-gray-300">
          <CardContent className="p-6 print:p-4">
            <h2 className="text-lg font-semibold mb-3 print:text-black">
              NOTES
            </h2>
            <div className="space-y-4">
              <div className="border-b border-gray-300 h-6"></div>
              <div className="border-b border-gray-300 h-6"></div>
              <div className="border-b border-gray-300 h-6"></div>
              <div className="border-b border-gray-300 h-6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
