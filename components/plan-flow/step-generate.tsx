"use client";

import { useState, useEffect, useCallback } from "react";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface StepGenerateProps {
  student: Student;
  plan: Plan;
  onBack?: () => void;
  onContinue?: (updatedPlan: Plan) => void;
}

// Plan section types
type EditableSection =
  | "replacement_behavior"
  | "prevention_strategies"
  | "reinforcement_plan"
  | "response_to_behavior";

type AllSections = "function_summary" | EditableSection;

interface SectionInfo {
  id: AllSections;
  title: string;
  description: string;
  editable: boolean;
}

const sections: SectionInfo[] = [
  {
    id: "function_summary",
    title: "Function Summary",
    description: "Why the behavior occurs",
    editable: false,
  },
  {
    id: "replacement_behavior",
    title: "Replacement Behavior",
    description: "Alternative behavior to teach",
    editable: true,
  },
  {
    id: "prevention_strategies",
    title: "Prevention Strategies",
    description: "Proactive strategies",
    editable: true,
  },
  {
    id: "reinforcement_plan",
    title: "Reinforcement Plan",
    description: "How to reinforce success",
    editable: true,
  },
  {
    id: "response_to_behavior",
    title: "Response to Target Behavior",
    description: "How to respond when it occurs",
    editable: true,
  },
];

const quickFeedbackOptions = [
  "Make it simpler",
  "Make it more detailed",
  "More specific to this student",
  "Adjust for classroom setting",
  "Adjust for home setting",
];

interface GeneratedContent {
  function_summary: string;
  replacement_behavior: string;
  prevention_strategies: string[];
  reinforcement_plan: string;
  response_to_behavior: string;
}

export function StepGenerate({
  student,
  plan,
  onBack,
  onContinue,
}: StepGenerateProps) {
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);

  // Editor state
  const [selectedSection, setSelectedSection] =
    useState<EditableSection | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [sectionsReviewed, setSectionsReviewed] = useState<string[]>([]);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Check if plan already has generated content
  useEffect(() => {
    if (plan.current_function_summary) {
      // Plan already has content, load it
      let preventionStrategies: string[] = [];
      try {
        const parsed = JSON.parse(plan.current_prevention_strategies || "[]");
        preventionStrategies = Array.isArray(parsed) ? parsed : [];
      } catch {
        preventionStrategies = [];
      }

      setGeneratedContent({
        function_summary: plan.current_function_summary,
        replacement_behavior: plan.current_replacement_behavior || "",
        prevention_strategies: preventionStrategies,
        reinforcement_plan: plan.current_reinforcement_plan || "",
        response_to_behavior: plan.current_response_to_behavior || "",
      });

      setSectionsReviewed(
        Array.isArray(plan.sections_reviewed) ? plan.sections_reviewed : []
      );
    } else {
      // Generate new plan
      generatePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setGeneratedContent(data.plan);
      setSelectedSection("replacement_behavior");
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate plan"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSectionClick = (sectionId: AllSections) => {
    // Only allow clicking on editable sections
    const section = sections.find((s) => s.id === sectionId);
    if (section?.editable) {
      setSelectedSection(sectionId as EditableSection);
      setFeedback("");
      setRevisionError(null);
    }
  };

  const getSectionContent = (sectionId: AllSections): string => {
    if (!generatedContent) return "";

    if (sectionId === "prevention_strategies") {
      return generatedContent.prevention_strategies
        .map((s, i) => `${i + 1}. ${s}`)
        .join("\n");
    }

    return generatedContent[sectionId] || "";
  };

  const handleRevise = async () => {
    if (!selectedSection || !feedback.trim()) return;

    setIsRevising(true);
    setRevisionError(null);

    try {
      const currentContent =
        selectedSection === "prevention_strategies"
          ? generatedContent?.prevention_strategies
              .map((s, i) => `${i + 1}. ${s}`)
              .join("\n")
          : generatedContent?.[selectedSection];

      const response = await fetch("/api/plans/revise-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          sectionName: selectedSection,
          currentContent,
          userFeedback: feedback,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revise section");
      }

      // Update the content
      setGeneratedContent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [selectedSection]: data.revisedContent,
        };
      });

      // Mark as reviewed
      markSectionReviewed(selectedSection);

      // Clear feedback and move to next section
      setFeedback("");
      advanceToNextSection();
    } catch (error) {
      setRevisionError(
        error instanceof Error ? error.message : "Failed to revise section"
      );
    } finally {
      setIsRevising(false);
    }
  };

  const handleKeepAsIs = () => {
    if (!selectedSection) return;
    markSectionReviewed(selectedSection);
    advanceToNextSection();
  };

  const handleResetToOriginal = async () => {
    if (!selectedSection) return;

    // Reset to original generated content
    const originalField = `generated_${selectedSection}` as keyof Plan;
    const originalContent = plan[originalField];

    if (originalContent) {
      let parsedContent = originalContent;
      if (selectedSection === "prevention_strategies") {
        try {
          parsedContent = JSON.parse(originalContent as string);
        } catch {
          parsedContent = [];
        }
      }

      setGeneratedContent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [selectedSection]: parsedContent,
        };
      });

      // Save the reset
      setIsSaving(true);
      try {
        const supabaseResponse = await fetch("/api/plans/update-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            sectionName: selectedSection,
            content: originalContent,
          }),
        });

        if (supabaseResponse.ok) {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error("Error resetting section:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const markSectionReviewed = useCallback(
    async (sectionId: EditableSection) => {
      if (!sectionsReviewed.includes(sectionId)) {
        const newReviewed = [...sectionsReviewed, sectionId];
        setSectionsReviewed(newReviewed);

        // Save to database
        setIsSaving(true);
        try {
          const response = await fetch("/api/plans/update-sections-reviewed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId: plan.id,
              sectionsReviewed: newReviewed,
            }),
          });

          if (response.ok) {
            setLastSaved(new Date());
          }
        } catch (error) {
          console.error("Error saving sections reviewed:", error);
        } finally {
          setIsSaving(false);
        }
      }
    },
    [sectionsReviewed, plan.id]
  );

  const advanceToNextSection = () => {
    const editableSections = sections.filter((s) => s.editable);
    const currentIndex = editableSections.findIndex(
      (s) => s.id === selectedSection
    );

    if (currentIndex < editableSections.length - 1) {
      setSelectedSection(editableSections[currentIndex + 1].id as EditableSection);
    } else {
      // All sections reviewed
      setSelectedSection(null);
    }
    setFeedback("");
    setRevisionError(null);
  };

  const handleQuickFeedback = (text: string) => {
    setFeedback(text);
  };

  const allSectionsReviewed =
    sectionsReviewed.length ===
    sections.filter((s) => s.editable).length;

  const handleFinalize = async () => {
    if (!generatedContent) return;

    // Update plan status to complete and call onContinue
    setIsSaving(true);
    try {
      const response = await fetch("/api/plans/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (response.ok) {
        const data = await response.json();
        onContinue?.(data.plan);
      }
    } catch (error) {
      console.error("Error finalizing plan:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Generating Behavior Plan
          </h2>
          <p className="text-muted-foreground mt-2">
            Creating a personalized plan for {student.name}...
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-sm font-medium">
                  Analyzing assessment results...
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take a moment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (generationError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Generation Error
          </h2>
          <p className="text-muted-foreground mt-2">
            Something went wrong while generating the plan.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto border-destructive">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
              <svg
                className="h-6 w-6 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {generationError}
            </p>
            <Button onClick={generatePlan}>Try Again</Button>
          </CardContent>
        </Card>

        {onBack && (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={onBack}>
              Go Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Main editor interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Review & Edit Plan
          </h2>
          <p className="text-muted-foreground mt-1">
            {allSectionsReviewed
              ? "All sections reviewed! Ready to finalize."
              : "Click on each section to review and make changes."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : lastSaved ? (
            <span>Saved</span>
          ) : null}
        </div>
      </div>

      {/* Split Pane Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Plan Preview */}
        <div className="space-y-3">
          {sections.map((section) => {
            const isSelected = selectedSection === section.id;
            const isReviewed = sectionsReviewed.includes(section.id);

            return (
              <Card
                key={section.id}
                className={cn(
                  "cursor-pointer transition-all",
                  section.editable
                    ? "hover:border-primary/50"
                    : "cursor-default opacity-80",
                  isSelected && "border-primary ring-2 ring-primary/20"
                )}
                onClick={() => handleSectionClick(section.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {section.title}
                        {!section.editable && (
                          <span className="text-xs text-muted-foreground font-normal">
                            (auto-generated)
                          </span>
                        )}
                        {isReviewed && section.editable && (
                          <svg
                            className="h-4 w-4 text-green-600"
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
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    {section.editable && (
                      <svg
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isSelected && "text-primary rotate-90"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                    {getSectionContent(section.id)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right: Editor Panel */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardContent className="p-6">
              {selectedSection ? (
                <div className="space-y-4">
                  {/* Section Header */}
                  <div>
                    <h3 className="font-semibold">
                      Editing:{" "}
                      {sections.find((s) => s.id === selectedSection)?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review the content below and provide feedback for revisions.
                    </p>
                  </div>

                  {/* Current Content */}
                  <div className="rounded-lg bg-muted p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {getSectionContent(selectedSection)}
                    </p>
                  </div>

                  {/* Quick Feedback Buttons */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Quick suggestions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickFeedbackOptions.map((option) => (
                        <Button
                          key={option}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleQuickFeedback(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Input */}
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      What would you like to change?
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g., Make it simpler, add more specific examples, focus on classroom strategies..."
                      rows={3}
                      disabled={isRevising}
                    />
                  </div>

                  {/* Revision Error */}
                  {revisionError && (
                    <p className="text-sm text-destructive">{revisionError}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleRevise}
                      disabled={!feedback.trim() || isRevising}
                      className="flex-1"
                    >
                      {isRevising ? (
                        <>
                          <svg
                            className="h-4 w-4 mr-2 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Revising...
                        </>
                      ) : (
                        "Revise This Section"
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleKeepAsIs}
                      disabled={isRevising}
                    >
                      Keep As Is
                    </Button>
                  </div>

                  {/* Reset Link */}
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={handleResetToOriginal}
                    disabled={isRevising}
                  >
                    Reset to original
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    {allSectionsReviewed
                      ? "All sections reviewed! Click Finalize Plan to continue."
                      : "Click on any section to review and edit it."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {!allSectionsReviewed && (
            <p className="text-sm text-muted-foreground mr-2">
              {sectionsReviewed.length} of {sections.filter((s) => s.editable).length} sections reviewed
            </p>
          )}
          <Button
            onClick={handleFinalize}
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? "Saving..." : "Finalize Plan"}
            <svg
              className="h-4 w-4 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
