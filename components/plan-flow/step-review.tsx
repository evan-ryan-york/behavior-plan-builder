"use client";

import Link from "next/link";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { functionInfo, BehaviorFunction } from "@/lib/assessment-questions";

interface StepReviewProps {
  student: Student;
  plan: Plan;
}

export function StepReview({ student, plan }: StepReviewProps) {
  // Parse prevention strategies if stored as JSON
  let preventionStrategies: string[] = [];
  try {
    const parsed = JSON.parse(plan.current_prevention_strategies || "[]");
    preventionStrategies = Array.isArray(parsed) ? parsed : [];
  } catch {
    preventionStrategies = [];
  }

  const determinedFunction = plan.determined_function as BehaviorFunction | null;

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
      </div>

      {/* Coming Soon Card */}
      <Card className="max-w-2xl mx-auto border-dashed">
        <CardContent className="p-6 text-center">
          <div className="text-3xl mb-2">🚧</div>
          <p className="text-sm text-muted-foreground">
            Export and sharing options coming in Session 7!
          </p>
        </CardContent>
      </Card>

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
              <p className="text-xs text-muted-foreground mt-2">
                Primary Function:{" "}
                <span className="font-medium">
                  {functionInfo[determinedFunction]?.label}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Function Summary */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Function Summary</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {plan.current_function_summary || "Not generated"}
            </p>
          </CardContent>
        </Card>

        {/* Replacement Behavior */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Replacement Behavior</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {plan.current_replacement_behavior || "Not generated"}
            </p>
          </CardContent>
        </Card>

        {/* Prevention Strategies */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Prevention Strategies</h4>
            {preventionStrategies.length > 0 ? (
              <ul className="space-y-2">
                {preventionStrategies.map((strategy, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="font-medium text-foreground">
                      {index + 1}.
                    </span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not generated</p>
            )}
          </CardContent>
        </Card>

        {/* Reinforcement Plan */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Reinforcement Plan</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {plan.current_reinforcement_plan || "Not generated"}
            </p>
          </CardContent>
        </Card>

        {/* Response to Target Behavior */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">
              Response to Target Behavior
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {plan.current_response_to_behavior || "Not generated"}
            </p>
          </CardContent>
        </Card>
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
