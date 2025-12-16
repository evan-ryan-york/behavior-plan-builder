"use client";

import { useState } from "react";
import { Student, Plan } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface StepBehaviorDetailsProps {
  student: Student;
  existingPlan?: Plan | null;
  onBack: () => void;
  onContinue: (plan: Plan) => void;
}

const frequencyOptions = [
  { value: "multiple_daily", label: "Multiple times per day" },
  { value: "once_daily", label: "About once per day" },
  { value: "few_weekly", label: "A few times per week" },
  { value: "once_weekly", label: "About once per week" },
  { value: "less_weekly", label: "Less than once per week" },
];

const intensityOptions = [
  {
    value: "mild",
    label: "Mild",
    description: "Minor disruption, easily redirected",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Significant disruption, requires intervention",
  },
  {
    value: "severe",
    label: "Severe",
    description: "Major disruption, affects entire class or environment",
  },
  {
    value: "safety_concern",
    label: "Safety concern",
    description: "Risk of harm to self or others",
  },
];

export function StepBehaviorDetails({
  student,
  existingPlan,
  onBack,
  onContinue,
}: StepBehaviorDetailsProps) {
  // Initialize from existing plan if available
  const [targetBehavior, setTargetBehavior] = useState(
    existingPlan?.target_behavior || ""
  );
  const [frequency, setFrequency] = useState(
    existingPlan?.behavior_frequency || ""
  );
  const [intensity, setIntensity] = useState(
    existingPlan?.behavior_intensity || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    targetBehavior?: string;
    frequency?: string;
    intensity?: string;
  }>({});

  const validate = () => {
    const errors: typeof validationErrors = {};

    if (!targetBehavior.trim()) {
      errors.targetBehavior = "Please describe the target behavior";
    }
    if (!frequency) {
      errors.frequency = "Please select how often this behavior occurs";
    }
    if (!intensity) {
      errors.intensity = "Please select the intensity level";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    // If we have an existing plan, update it; otherwise create a new one
    if (existingPlan) {
      const { data, error: updateError } = await supabase
        .from("plans")
        .update({
          target_behavior: targetBehavior.trim(),
          behavior_frequency: frequency,
          behavior_intensity: intensity,
        })
        .eq("id", existingPlan.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      onContinue(data as Plan);
    } else {
      const { data, error: insertError } = await supabase
        .from("plans")
        .insert({
          user_id: user.id,
          student_id: student.id,
          status: "in_progress",
          target_behavior: targetBehavior.trim(),
          behavior_frequency: frequency,
          behavior_intensity: intensity,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      onContinue(data as Plan);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Behavior Plan for {student.name}
        </h2>
        <p className="text-muted-foreground mt-2">
          Describe the behavior you want to address.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="grid gap-2">
          <Label htmlFor="target-behavior" className="text-base font-medium">
            What is the target behavior? *
          </Label>
          <p className="text-sm text-muted-foreground">
            Describe the specific behavior you want to address. Be observable and
            measurable.
          </p>
          <Textarea
            id="target-behavior"
            value={targetBehavior}
            onChange={(e) => {
              setTargetBehavior(e.target.value);
              if (validationErrors.targetBehavior) {
                setValidationErrors((prev) => ({
                  ...prev,
                  targetBehavior: undefined,
                }));
              }
            }}
            placeholder="e.g., Leaves seat without permission during independent work time, Calls out answers without raising hand, Hits or pushes other students when frustrated..."
            rows={4}
            className={cn(
              "resize-none",
              validationErrors.targetBehavior && "border-destructive"
            )}
          />
          {validationErrors.targetBehavior && (
            <p className="text-sm text-destructive">
              {validationErrors.targetBehavior}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <Label className="text-base font-medium">
            How often does this behavior occur? *
          </Label>
          <div className="grid gap-2">
            {frequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFrequency(option.value);
                  if (validationErrors.frequency) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      frequency: undefined,
                    }));
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  frequency === option.value &&
                    "border-primary bg-primary/5 ring-1 ring-primary",
                  validationErrors.frequency && "border-destructive/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    frequency === option.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {frequency === option.value && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          {validationErrors.frequency && (
            <p className="text-sm text-destructive">
              {validationErrors.frequency}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <Label className="text-base font-medium">
            How intense is the behavior when it occurs? *
          </Label>
          <div className="grid gap-2">
            {intensityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setIntensity(option.value);
                  if (validationErrors.intensity) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      intensity: undefined,
                    }));
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  intensity === option.value &&
                    "border-primary bg-primary/5 ring-1 ring-primary",
                  validationErrors.intensity && "border-destructive/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    intensity === option.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {intensity === option.value && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <div>
                  <span className="font-medium">{option.label}</span>
                  <span className="text-muted-foreground"> — {option.description}</span>
                </div>
              </button>
            ))}
          </div>
          {validationErrors.intensity && (
            <p className="text-sm text-destructive">
              {validationErrors.intensity}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button onClick={handleContinue} disabled={loading} size="lg">
          {loading ? "Creating Plan..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
