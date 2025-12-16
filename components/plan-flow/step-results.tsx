"use client";

import { useState, useEffect } from "react";
import { Student, Plan } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AssessmentResponses,
  BehaviorFunction,
  FunctionScores,
  calculateFunctionScores,
  determinePrimaryFunction,
  functionInfo,
} from "@/lib/assessment-questions";

interface StepResultsProps {
  student: Student;
  plan: Plan;
  onBack: () => void;
  onContinue: (updatedPlan: Plan) => void;
}

const functionOrder: BehaviorFunction[] = [
  "escape",
  "attention",
  "access",
  "sensory",
];

export function StepResults({
  student,
  plan,
  onBack,
  onContinue,
}: StepResultsProps) {
  const [scores, setScores] = useState<FunctionScores | null>(null);
  const [calculatedFunction, setCalculatedFunction] = useState<
    BehaviorFunction | "multiple" | null
  >(null);
  const [tiedFunctions, setTiedFunctions] = useState<BehaviorFunction[]>([]);
  const [overrideFunction, setOverrideFunction] = useState<
    BehaviorFunction | null
  >(null);
  const [agreedWithCalculation, setAgreedWithCalculation] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate scores on mount
  useEffect(() => {
    const responses = plan.assessment_responses as AssessmentResponses;
    if (responses) {
      const calculatedScores = calculateFunctionScores(responses);
      const determination = determinePrimaryFunction(calculatedScores);

      setScores(determination.allScores);
      setCalculatedFunction(determination.primary);
      if (determination.tiedFunctions) {
        setTiedFunctions(determination.tiedFunctions);
      }
    }
  }, [plan.assessment_responses]);

  const getPrimaryFunctionLabel = (): string => {
    if (calculatedFunction === "multiple") {
      return tiedFunctions
        .map((f) => functionInfo[f].label)
        .join(" and ");
    }
    if (calculatedFunction) {
      return functionInfo[calculatedFunction].label;
    }
    return "Unknown";
  };

  const getPrimaryFunctionDescription = (): string => {
    const func = overrideFunction || calculatedFunction;
    if (func && func !== "multiple") {
      return functionInfo[func].description.replace(
        /\[Student\]/g,
        student.name
      );
    }
    if (func === "multiple" && tiedFunctions.length > 0) {
      return functionInfo[tiedFunctions[0]].description.replace(
        /\[Student\]/g,
        student.name
      );
    }
    return "";
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);

    // Determine the final function
    const finalFunction =
      overrideFunction ||
      (calculatedFunction === "multiple"
        ? tiedFunctions[0]
        : calculatedFunction);

    const supabase = createClient();

    const { data, error: updateError } = await supabase
      .from("plans")
      .update({
        function_scores: scores,
        calculated_function: calculatedFunction,
        determined_function: finalFunction,
        status: "assessment_complete",
      })
      .eq("id", plan.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onContinue(data as Plan);
  };

  if (!scores) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const highestScore = Math.max(
    ...Object.values(scores).filter((s): s is number => s !== null)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Assessment Complete
        </h2>
      </div>

      {/* Primary Function Card */}
      <Card className="max-w-2xl mx-auto border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <p className="text-muted-foreground mb-2">
            Based on your responses, {student.name}&apos;s behavior appears to be
            primarily driven by:
          </p>
          <p className="text-2xl font-bold text-primary mb-4">
            {getPrimaryFunctionLabel()}
          </p>
          <p className="text-sm text-muted-foreground">
            {getPrimaryFunctionDescription()}
          </p>

          {calculatedFunction === "multiple" && tiedFunctions.length > 1 && (
            <div className="mt-4 p-3 bg-background/50 rounded-lg border border-primary/20">
              <p className="text-sm">
                <span className="font-medium">Note:</span> Multiple functions
                may be contributing to this behavior. The plan will address
                strategies for{" "}
                {tiedFunctions
                  .map((f) => functionInfo[f].label)
                  .join(" and ")}
                .
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Visualization */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h3 className="font-semibold text-lg">Function Scores</h3>

        <div className="space-y-3">
          {functionOrder.map((func) => {
            const score = scores[func];
            const isHighest = score === highestScore && score !== null;
            const percentage = score !== null ? (score / 3) * 100 : 0;

            return (
              <div key={func} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={cn(
                      "font-medium",
                      isHighest && "text-primary"
                    )}
                  >
                    {functionInfo[func].label}
                  </span>
                  <span className="text-muted-foreground">
                    {score !== null ? `${score.toFixed(2)} / 3.0` : "Not enough data"}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  {score !== null ? (
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isHighest ? "bg-primary" : "bg-primary/40"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  ) : (
                    <div className="h-full bg-muted-foreground/20 rounded-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">—</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Override Section */}
      <div className="max-w-2xl mx-auto space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-lg">
          Does this seem right based on your experience with {student.name}?
        </h3>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setAgreedWithCalculation(true);
              setOverrideFunction(null);
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-4 w-full text-left transition-colors hover:bg-muted/50",
              agreedWithCalculation === true &&
                "border-primary bg-primary/5 ring-1 ring-primary"
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2",
                agreedWithCalculation === true
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {agreedWithCalculation === true && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </div>
            <span className="font-medium">
              Yes, this matches what I&apos;ve observed
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAgreedWithCalculation(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-4 w-full text-left transition-colors hover:bg-muted/50",
              agreedWithCalculation === false &&
                "border-primary bg-primary/5 ring-1 ring-primary"
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2",
                agreedWithCalculation === false
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {agreedWithCalculation === false && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </div>
            <span className="font-medium">
              I think it&apos;s primarily about something else
            </span>
          </button>

          {/* Function override selector */}
          {agreedWithCalculation === false && (
            <div className="ml-8 space-y-2 pt-2">
              <Label className="text-sm text-muted-foreground">
                Which function do you think is primary?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {functionOrder.map((func) => (
                  <button
                    key={func}
                    type="button"
                    onClick={() => setOverrideFunction(func)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-muted/50",
                      overrideFunction === func
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {functionInfo[func].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button onClick={handleContinue} disabled={loading} size="lg">
          {loading ? "Saving..." : "Continue to Plan Generation"}
        </Button>
      </div>
    </div>
  );
}
