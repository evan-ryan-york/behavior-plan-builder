"use client";

import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
  enabled: boolean;
}

interface ProgressIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps: Step[] = [
  { number: 1, label: "Select Student", enabled: true },
  { number: 2, label: "Student Details", enabled: true },
  { number: 3, label: "Behavior Details", enabled: true },
  { number: 4, label: "Assessment", enabled: true },
  { number: 5, label: "Generate Plan", enabled: true },
  { number: 6, label: "Review & Export", enabled: true },
];

export function ProgressIndicator({
  currentStep,
  onStepClick,
}: ProgressIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop view */}
      <nav aria-label="Progress" className="hidden md:block">
        <ol className="flex items-center justify-center gap-2">
          {steps.map((step, index) => {
            const isCompleted = step.enabled && currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isClickable = step.enabled && currentStep > step.number;

            return (
              <li key={step.number} className="flex items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick?.(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isCurrent && "bg-primary/10",
                    isClickable && "hover:bg-muted cursor-pointer",
                    !step.enabled && "opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary",
                      !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-foreground",
                      isCompleted && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-8 mx-1",
                      currentStep > step.number ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile view - compact dots */}
      <nav aria-label="Progress" className="md:hidden">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isCompleted = step.enabled && currentStep > step.number;
              const isCurrent = currentStep === step.number;
              const isClickable = step.enabled && currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isClickable && onStepClick?.(step.number)}
                    disabled={!isClickable}
                    className={cn(
                      "flex h-3 w-3 rounded-full transition-colors",
                      isCompleted && "bg-primary",
                      isCurrent && "bg-primary ring-2 ring-primary/30 ring-offset-2",
                      !isCompleted && !isCurrent && step.enabled && "bg-muted-foreground/30",
                      !step.enabled && "bg-muted-foreground/20"
                    )}
                    aria-label={`Step ${step.number}: ${step.label}`}
                  />
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-px w-4 mx-1",
                        currentStep > step.number ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-sm font-medium text-foreground">
            Step {currentStep}: {steps.find((s) => s.number === currentStep)?.label}
          </span>
        </div>
      </nav>
    </div>
  );
}
