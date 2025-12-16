"use client";

import { useState } from "react";
import { Student, Plan } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { implementerOptions } from "@/lib/assessment-questions";

interface StepFollowupProps {
  student: Student;
  plan: Plan;
  onBack: () => void;
  onContinue: (updatedPlan: Plan) => void;
}

export function StepFollowup({
  student,
  plan,
  onBack,
  onContinue,
}: StepFollowupProps) {
  const [whatsTried, setWhatsTried] = useState(plan.whats_been_tried || "");
  const [selectedImplementers, setSelectedImplementers] = useState<string[]>(
    plan.implementer ? JSON.parse(plan.implementer) : []
  );
  const [otherImplementer, setOtherImplementer] = useState("");
  const [includeOther, setIncludeOther] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleImplementerToggle = (value: string) => {
    setSelectedImplementers((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleOtherToggle = () => {
    setIncludeOther((prev) => !prev);
    if (!includeOther) {
      setOtherImplementer("");
    }
    if (validationError) {
      setValidationError(null);
    }
  };

  const validate = (): boolean => {
    const hasImplementer =
      selectedImplementers.length > 0 ||
      (includeOther && otherImplementer.trim().length > 0);

    if (!hasImplementer) {
      setValidationError(
        "Please select at least one person who will implement this plan."
      );
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError(null);

    // Build implementer array
    const implementers = [...selectedImplementers];
    if (includeOther && otherImplementer.trim()) {
      implementers.push(`Other: ${otherImplementer.trim()}`);
    }

    const supabase = createClient();

    const { data, error: updateError } = await supabase
      .from("plans")
      .update({
        whats_been_tried: whatsTried.trim() || null,
        implementer: JSON.stringify(implementers),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          A few more questions to personalize the plan
        </h2>
        <p className="text-muted-foreground mt-2">
          This information helps us tailor strategies for {student.name}.
        </p>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto">
        {/* What's been tried */}
        <div className="space-y-3">
          <Label htmlFor="whats-tried" className="text-base font-medium">
            What strategies or interventions have already been tried?
          </Label>
          <p className="text-sm text-muted-foreground">
            This helps us avoid suggesting things that haven&apos;t worked.
          </p>
          <Textarea
            id="whats-tried"
            value={whatsTried}
            onChange={(e) => setWhatsTried(e.target.value)}
            placeholder="e.g., Visual schedule, token board, breaks, moving seat, parent contact..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Who will implement */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Who will be implementing this plan? *
          </Label>
          <p className="text-sm text-muted-foreground">
            Select all that apply. This helps us tailor the strategies to the
            right context.
          </p>

          <div className="grid gap-2">
            {implementerOptions.map((option) => {
              const isSelected = selectedImplementers.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleImplementerToggle(option.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
                    validationError &&
                      !selectedImplementers.length &&
                      !includeOther &&
                      "border-destructive/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}

            {/* Other option */}
            <div
              className={cn(
                "rounded-lg border p-4 transition-colors",
                includeOther && "border-primary bg-primary/5 ring-1 ring-primary",
                validationError &&
                  !selectedImplementers.length &&
                  !includeOther &&
                  "border-destructive/50"
              )}
            >
              <button
                type="button"
                onClick={handleOtherToggle}
                className="flex items-center gap-3 w-full text-left"
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                    includeOther
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {includeOther && (
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-medium">Other</span>
              </button>

              {includeOther && (
                <div className="mt-3 ml-8">
                  <Input
                    type="text"
                    placeholder="Please specify..."
                    value={otherImplementer}
                    onChange={(e) => setOtherImplementer(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
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
          {loading ? "Saving..." : "View Results"}
        </Button>
      </div>
    </div>
  );
}
