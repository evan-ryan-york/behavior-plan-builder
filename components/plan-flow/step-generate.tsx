"use client";

import Link from "next/link";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { functionInfo, BehaviorFunction } from "@/lib/assessment-questions";

interface StepGenerateProps {
  student: Student;
  plan: Plan;
}

const frequencyLabels: Record<string, string> = {
  multiple_daily: "Multiple times per day",
  once_daily: "About once per day",
  few_weekly: "A few times per week",
  once_weekly: "About once per week",
  less_weekly: "Less than once per week",
};

const intensityLabels: Record<string, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  safety_concern: "Safety concern",
};

export function StepGenerate({ student, plan }: StepGenerateProps) {
  const determinedFunction = plan.determined_function as BehaviorFunction | null;
  const functionScore = determinedFunction && plan.function_scores
    ? (plan.function_scores as Record<string, number | null>)[determinedFunction]
    : null;
  const implementers = plan.implementer
    ? JSON.parse(plan.implementer)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Generate Behavior Plan
        </h2>
        <p className="text-muted-foreground mt-2">
          Coming in Session 5!
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">AI Plan Generation</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This is where AI will generate your personalized behavior plan based
              on everything you&apos;ve told us about {student.name}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary of Collected Information */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h3 className="font-semibold text-lg">Information Collected</h3>

        <div className="grid gap-4">
          {/* Student Info */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="font-medium">Student</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {student.name}
              {student.grade_level && `, Grade ${student.grade_level}`}
            </p>
          </div>

          {/* Target Behavior */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="font-medium">Target Behavior</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {plan.target_behavior || "Not specified"}
            </p>
          </div>

          {/* Frequency & Intensity */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Frequency</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.behavior_frequency
                  ? frequencyLabels[plan.behavior_frequency] ||
                    plan.behavior_frequency
                  : "Not specified"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="font-medium">Intensity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.behavior_intensity
                  ? intensityLabels[plan.behavior_intensity] ||
                    plan.behavior_intensity
                  : "Not specified"}
              </p>
            </div>
          </div>

          {/* Primary Function */}
          <div className="rounded-lg border p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span className="font-medium text-primary">Primary Function</span>
            </div>
            <p className="text-sm">
              {determinedFunction
                ? functionInfo[determinedFunction].label
                : "Not determined"}
              {functionScore !== null && (
                <span className="text-muted-foreground">
                  {" "}
                  ({functionScore.toFixed(2)}/3.0)
                </span>
              )}
            </p>
          </div>

          {/* What's been tried */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span className="font-medium">What&apos;s Been Tried</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {plan.whats_been_tried || "Nothing noted"}
            </p>
          </div>

          {/* Implementers */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="font-medium">Implementers</span>
            </div>
            {implementers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {implementers.map((impl: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                  >
                    {impl.startsWith("Other: ")
                      ? impl.replace("Other: ", "")
                      : impl
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not specified</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center pt-4">
        <Button asChild size="lg">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
