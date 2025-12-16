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
import { Card, CardContent } from "@/components/ui/card";

interface PlanCreationFlowProps {
  students: Student[];
  preselectedStudentId?: string;
}

export function PlanCreationFlow({
  students,
  preselectedStudentId,
}: PlanCreationFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [createdPlan, setCreatedPlan] = useState<Plan | null>(null);

  // Handle preselected student from URL
  useEffect(() => {
    const studentId = preselectedStudentId || searchParams.get("studentId");
    if (studentId) {
      const student = students.find((s) => s.id === studentId);
      if (student) {
        setSelectedStudent(student);
        setCurrentStep(2);
      }
    }
  }, [preselectedStudentId, searchParams, students]);

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
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
  };

  const handleSaveAndExit = () => {
    if (selectedStudent) {
      router.push(`/dashboard/students/${selectedStudent.id}`);
    } else {
      router.push("/dashboard/students");
    }
  };

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
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <StepSelectStudent
              students={students}
              selectedStudent={selectedStudent}
              onSelectStudent={handleSelectStudent}
              onContinue={handleStep1Continue}
            />
          )}

          {currentStep === 2 && selectedStudent && (
            <StepStudentContext
              student={selectedStudent}
              onBack={handleStep2Back}
              onContinue={handleStep2Continue}
            />
          )}

          {currentStep === 3 && selectedStudent && (
            <StepBehaviorDetails
              student={selectedStudent}
              onBack={handleStep3Back}
              onContinue={handleStep3Continue}
            />
          )}

          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Assessment
                </h2>
                <p className="text-muted-foreground mt-2">
                  Step 4: Function Assessment
                </p>
              </div>

              <Card className="max-w-md mx-auto">
                <CardContent className="p-8">
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
                  <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    The function assessment step will help identify why the
                    behavior is occurring. This feature is under development.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your plan has been saved as &quot;In Progress&quot; and you can
                    continue later.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button asChild>
                      <Link
                        href={
                          selectedStudent
                            ? `/dashboard/students/${selectedStudent.id}`
                            : "/dashboard/plans"
                        }
                      >
                        View Student Profile
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard/plans">View All Plans</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
