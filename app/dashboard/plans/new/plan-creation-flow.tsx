"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/plan-flow/progress-indicator";
import { StepSelectStudent } from "@/components/plan-flow/step-select-student";
import { StepStudentContext } from "@/components/plan-flow/step-student-context";
import { StepBehaviorDetails } from "@/components/plan-flow/step-behavior-details";
import { StepAssessment } from "@/components/plan-flow/step-assessment";
import { StepFollowup } from "@/components/plan-flow/step-followup";
import { StepResults } from "@/components/plan-flow/step-results";
import { StepGenerate } from "@/components/plan-flow/step-generate";

interface PlanCreationFlowProps {
  students: Student[];
  preselectedStudentId?: string;
  existingPlan?: Plan | null;
  existingStudent?: Student | null;
}

// Assessment flow has sub-steps within step 4
type AssessmentSubStep = "questions" | "followup" | "results";

// Determine initial step based on existing plan state
function getInitialStep(plan: Plan | null | undefined): {
  step: number;
  subStep: AssessmentSubStep;
} {
  if (!plan) {
    return { step: 1, subStep: "questions" };
  }

  // If plan exists with behavior details, go to step 4 (assessment)
  if (plan.target_behavior && plan.behavior_frequency && plan.behavior_intensity) {
    // Check if assessment is complete
    if (plan.status === "assessment_complete" || plan.determined_function) {
      return { step: 5, subStep: "questions" };
    }
    // Check if assessment responses exist
    if (plan.assessment_responses && Object.keys(plan.assessment_responses).length > 0) {
      // If all 21 questions answered, go to followup
      if (Object.keys(plan.assessment_responses).length === 21) {
        return { step: 4, subStep: "followup" };
      }
    }
    return { step: 4, subStep: "questions" };
  }

  // If plan exists but no behavior details, start at step 3
  return { step: 3, subStep: "questions" };
}

export function PlanCreationFlow({
  students,
  preselectedStudentId,
  existingPlan,
  existingStudent,
}: PlanCreationFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine initial state based on existing plan
  const initialState = getInitialStep(existingPlan);

  const [currentStep, setCurrentStep] = useState(initialState.step);
  const [assessmentSubStep, setAssessmentSubStep] =
    useState<AssessmentSubStep>(initialState.subStep);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    existingStudent || null
  );
  const [createdPlan, setCreatedPlan] = useState<Plan | null>(
    existingPlan || null
  );

  // Handle preselected student from URL (only if no existing plan)
  useEffect(() => {
    if (existingPlan || existingStudent) {
      // Already handled via props
      return;
    }

    const studentId = preselectedStudentId || searchParams.get("studentId");
    if (studentId) {
      const student = students.find((s) => s.id === studentId);
      if (student) {
        setSelectedStudent(student);
        setCurrentStep(2);
      }
    }
  }, [preselectedStudentId, searchParams, students, existingPlan, existingStudent]);

  const handleStepClick = (step: number) => {
    // Only allow going back to previously completed steps
    if (step < currentStep) {
      setCurrentStep(step);
      // Reset assessment sub-step when going back
      if (step < 4) {
        setAssessmentSubStep("questions");
      }
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleStep1Continue = () => {
    setCurrentStep(2);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep2Continue = (updatedStudent: Student) => {
    setSelectedStudent(updatedStudent);
    setCurrentStep(3);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStep3Continue = (plan: Plan) => {
    setCreatedPlan(plan);
    setCurrentStep(4);
    setAssessmentSubStep("questions");
  };

  // Step 4: Assessment sub-step handlers
  const handleAssessmentBack = () => {
    setCurrentStep(3);
  };

  const handleAssessmentContinue = (updatedPlan: Plan) => {
    setCreatedPlan(updatedPlan);
    setAssessmentSubStep("followup");
  };

  const handleFollowupBack = () => {
    setAssessmentSubStep("questions");
  };

  const handleFollowupContinue = (updatedPlan: Plan) => {
    setCreatedPlan(updatedPlan);
    setAssessmentSubStep("results");
  };

  const handleResultsBack = () => {
    setAssessmentSubStep("followup");
  };

  const handleResultsContinue = (updatedPlan: Plan) => {
    setCreatedPlan(updatedPlan);
    setCurrentStep(5);
  };

  const handleSaveAndExit = () => {
    if (selectedStudent) {
      router.push(`/dashboard/students/${selectedStudent.id}`);
    } else {
      router.push("/dashboard/students");
    }
  };

  // Determine the effective step for the progress indicator
  // Step 4 has sub-steps, but they all show as step 4 in the indicator
  const effectiveStep = currentStep;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 flex h-14 items-center justify-between">
          <Link
            href="/dashboard"
            className="font-bold text-lg hover:opacity-80 transition-opacity"
          >
            Behavior Plan Builder
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSaveAndExit}>
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Save & Exit
          </Button>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="border-b bg-muted/30 py-4">
        <div className="container mx-auto px-4 md:px-6">
          <ProgressIndicator
            currentStep={effectiveStep}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Student */}
          {currentStep === 1 && (
            <StepSelectStudent
              students={students}
              selectedStudent={selectedStudent}
              onSelectStudent={handleSelectStudent}
              onContinue={handleStep1Continue}
            />
          )}

          {/* Step 2: Student Context */}
          {currentStep === 2 && selectedStudent && (
            <StepStudentContext
              student={selectedStudent}
              onBack={handleStep2Back}
              onContinue={handleStep2Continue}
            />
          )}

          {/* Step 3: Behavior Details */}
          {currentStep === 3 && selectedStudent && (
            <StepBehaviorDetails
              student={selectedStudent}
              existingPlan={createdPlan}
              onBack={handleStep3Back}
              onContinue={handleStep3Continue}
            />
          )}

          {/* Step 4: Assessment (with sub-steps) */}
          {currentStep === 4 && selectedStudent && createdPlan && (
            <>
              {assessmentSubStep === "questions" && (
                <StepAssessment
                  student={selectedStudent}
                  plan={createdPlan}
                  onBack={handleAssessmentBack}
                  onContinue={handleAssessmentContinue}
                />
              )}

              {assessmentSubStep === "followup" && (
                <StepFollowup
                  student={selectedStudent}
                  plan={createdPlan}
                  onBack={handleFollowupBack}
                  onContinue={handleFollowupContinue}
                />
              )}

              {assessmentSubStep === "results" && (
                <StepResults
                  student={selectedStudent}
                  plan={createdPlan}
                  onBack={handleResultsBack}
                  onContinue={handleResultsContinue}
                />
              )}
            </>
          )}

          {/* Step 5: Generate Plan (placeholder) */}
          {currentStep === 5 && selectedStudent && createdPlan && (
            <StepGenerate student={selectedStudent} plan={createdPlan} />
          )}
        </div>
      </main>
    </div>
  );
}
