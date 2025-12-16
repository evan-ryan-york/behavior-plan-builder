"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { functionInfo, BehaviorFunction } from "@/lib/assessment-questions";
import { ExportDropdown } from "@/components/export-dropdown";

interface StepReviewProps {
  student: Student;
  plan: Plan;
}

export function StepReview({ student, plan }: StepReviewProps) {
  const router = useRouter();

  // Parse prevention strategies if stored as JSON
  let preventionStrategies: string[] = [];
  try {
    const parsed = JSON.parse(plan.current_prevention_strategies || "[]");
    preventionStrategies = Array.isArray(parsed) ? parsed : [];
  } catch {
    preventionStrategies = [];
  }

  const determinedFunction = plan.determined_function as BehaviorFunction | null;
  const secondaryFunction = plan.secondary_function as BehaviorFunction | null;

  // Format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleEditPlan = () => {
    // Navigate back to the plan editor (step 5)
    // The plan-creation-flow will detect the plan status and handle appropriately
    router.push(`/dashboard/plans/new?planId=${plan.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Plan Complete!</h2>
        <p className="text-muted-foreground mt-2">
          Behavior plan for {student.name} has been finalized.
        </p>
        {plan.finalized_at && (
          <p className="text-sm text-muted-foreground mt-1">
            Finalized on {formatDate(plan.finalized_at)}
          </p>
        )}
      </div>

      {/* Export Actions */}
      <div className="flex justify-center gap-4">
        <Button asChild variant="outline">
          <Link href={`/dashboard/plans/${plan.id}`}>
            View Full Plan
          </Link>
        </Button>
        <ExportDropdown
          planId={plan.id}
          studentName={student.name}
          shareToken={plan.share_token}
          shareEnabled={plan.share_enabled}
        />
      </div>

      {/* Final Plan Display */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold text-center">
          Behavior Intervention Plan
        </h3>

        {/* Student Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.grade_level ? `Grade ${student.grade_level}` : "Grade not specified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Behavior */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Target Behavior</h4>
            <p className="text-sm text-muted-foreground">
              {plan.target_behavior || "Not specified"}
            </p>
            {determinedFunction && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Primary Function:{" "}
                  <span className="font-medium text-foreground">
                    {functionInfo[determinedFunction]?.label}
                  </span>
                </p>
                {secondaryFunction && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Secondary Function:{" "}
                    <span className="font-medium text-foreground">
                      {functionInfo[secondaryFunction]?.label}
                    </span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Function Summary */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Function Summary</h4>
            <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
              <Markdown>{plan.current_function_summary || "Not generated"}</Markdown>
            </div>
          </CardContent>
        </Card>

        {/* Replacement Behavior */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Replacement Behavior</h4>
            <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
              <Markdown>{plan.current_replacement_behavior || "Not generated"}</Markdown>
            </div>
          </CardContent>
        </Card>

        {/* Prevention Strategies */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Prevention Strategies</h4>
            {preventionStrategies.length > 0 ? (
              <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                <Markdown>{preventionStrategies.join("\n\n")}</Markdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not generated</p>
            )}
          </CardContent>
        </Card>

        {/* Reinforcement Plan */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Reinforcement Plan</h4>
            <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
              <Markdown>{plan.current_reinforcement_plan || "Not generated"}</Markdown>
            </div>
          </CardContent>
        </Card>

        {/* Response to Target Behavior */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">
              Response to Target Behavior
            </h4>
            <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
              <Markdown>{plan.current_response_to_behavior || "Not generated"}</Markdown>
            </div>
          </CardContent>
        </Card>

        {/* Plan Metadata */}
        {plan.revision_counts && Object.keys(plan.revision_counts).length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Revision History</h4>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {Object.entries(plan.revision_counts).map(([section, count]) => (
                  <div key={section} className="flex items-center gap-1">
                    <span className="capitalize">{section.replace(/_/g, " ")}</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded">
                      {count} revision{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" onClick={handleEditPlan}>
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Plan
        </Button>
        <Button asChild size="lg">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
