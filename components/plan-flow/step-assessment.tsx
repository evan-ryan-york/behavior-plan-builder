"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Student, Plan } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  assessmentQuestions,
  responseOptions,
  formatQuestionText,
  AssessmentResponses,
  ResponseValue,
} from "@/lib/assessment-questions";

interface StepAssessmentProps {
  student: Student;
  plan: Plan;
  onBack: () => void;
  onContinue: (updatedPlan: Plan) => void;
}

export function StepAssessment({
  student,
  plan,
  onBack,
  onContinue,
}: StepAssessmentProps) {
  // Initialize responses from existing plan data or empty object
  const [responses, setResponses] = useState<AssessmentResponses>(
    (plan.assessment_responses as AssessmentResponses) || {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [unansweredQuestions, setUnansweredQuestions] = useState<number[]>([]);
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Count answered questions
  const answeredCount = Object.keys(responses).length;
  const totalQuestions = assessmentQuestions.length;
  const hasPartialProgress = answeredCount > 0 && answeredCount < totalQuestions;

  // Debounced save function
  const saveResponses = useCallback(
    async (newResponses: AssessmentResponses) => {
      const supabase = createClient();
      await supabase
        .from("plans")
        .update({ assessment_responses: newResponses })
        .eq("id", plan.id);
    },
    [plan.id]
  );

  // Save responses when they change (debounced)
  useEffect(() => {
    if (Object.keys(responses).length === 0) return;

    const timeoutId = setTimeout(() => {
      saveResponses(responses);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [responses, saveResponses]);

  const handleResponseChange = (
    questionNumber: number,
    value: ResponseValue
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionNumber.toString()]: value,
    }));

    // Clear validation error for this question
    setUnansweredQuestions((prev) =>
      prev.filter((q) => q !== questionNumber)
    );
    if (validationError) {
      setValidationError(null);
    }
  };

  const validate = (): boolean => {
    const unanswered = assessmentQuestions
      .filter((q) => !responses[q.number.toString()])
      .map((q) => q.number);

    if (unanswered.length > 0) {
      setUnansweredQuestions(unanswered);
      setValidationError(
        `Please answer all questions. ${unanswered.length} question${
          unanswered.length === 1 ? "" : "s"
        } remaining.`
      );

      // Scroll to first unanswered question
      const firstUnanswered = unanswered[0];
      const element = questionRefs.current[firstUnanswered];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

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

    const supabase = createClient();

    // Save the final responses
    const { data, error: updateError } = await supabase
      .from("plans")
      .update({ assessment_responses: responses })
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
          Function Assessment for {student.name}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          These questions help us understand why {student.name} engages in{" "}
          <span className="font-medium text-foreground">
            {plan.target_behavior || "the target behavior"}
          </span>
          . Answer based on your observations.
        </p>
      </div>

      {/* Progress and Resume Notice */}
      {hasPartialProgress && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-primary mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-sm">Welcome back!</p>
              <p className="text-sm text-muted-foreground">
                Your progress has been saved. You answered {answeredCount} of{" "}
                {totalQuestions} questions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Progress</span>
          <span>
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {assessmentQuestions.map((question) => {
          const isUnanswered = unansweredQuestions.includes(question.number);
          const currentResponse = responses[question.number.toString()];

          return (
            <div
              key={question.number}
              ref={(el) => {
                questionRefs.current[question.number] = el;
              }}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                isUnanswered && "border-destructive bg-destructive/5",
                currentResponse && "border-primary/30 bg-primary/5"
              )}
            >
              {/* Question header */}
              <div className="flex items-start gap-3 mb-4">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                    currentResponse
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {question.number}
                </span>
                <p className="text-sm font-medium leading-relaxed pt-0.5">
                  {formatQuestionText(question.text, student.name)}
                </p>
              </div>

              {/* Response options - horizontal on desktop, vertical on mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-10">
                {responseOptions.map((option) => {
                  const isSelected = currentResponse === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleResponseChange(question.number, option.value)
                      }
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                        "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation error message */}
      {validationError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-destructive">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 sticky bottom-0 bg-background pb-4 border-t mt-8">
        <Button type="button" variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button onClick={handleContinue} disabled={loading} size="lg">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
