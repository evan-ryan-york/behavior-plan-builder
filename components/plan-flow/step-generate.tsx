"use client";

import { useState, useEffect, useCallback } from "react";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/ui/markdown";
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
    description: "Proactive strategies to prevent the behavior",
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
  "More detailed",
  "More specific to student",
];

interface GeneratedContent {
  function_summary: string;
  replacement_behavior: string;
  replacement_behavior_rationale: string;
  prevention_strategies: string[];
  prevention_strategies_rationale: string;
  reinforcement_plan: string;
  reinforcement_plan_rationale: string;
  response_to_behavior: string;
  response_to_behavior_rationale: string;
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
        replacement_behavior_rationale: "Rationale not available for previously generated plans. Click 'Rebuild Plan' to generate with rationales.",
        prevention_strategies: preventionStrategies,
        prevention_strategies_rationale: "Rationale not available for previously generated plans. Click 'Rebuild Plan' to generate with rationales.",
        reinforcement_plan: plan.current_reinforcement_plan || "",
        reinforcement_plan_rationale: "Rationale not available for previously generated plans. Click 'Rebuild Plan' to generate with rationales.",
        response_to_behavior: plan.current_response_to_behavior || "",
        response_to_behavior_rationale: "Rationale not available for previously generated plans. Click 'Rebuild Plan' to generate with rationales.",
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
      // Join strategies with double line breaks for spacing
      return generatedContent.prevention_strategies.join("\n\n");
    }

    return generatedContent[sectionId] || "";
  };

  const getSectionRationale = (sectionId: EditableSection): string => {
    if (!generatedContent) return "";
    const rationaleKey = `${sectionId}_rationale` as keyof GeneratedContent;
    return (generatedContent[rationaleKey] as string) || "";
  };

  const handleRevise = async () => {
    if (!selectedSection || !feedback.trim()) return;

    setIsRevising(true);
    setRevisionError(null);

    try {
      const currentContent =
        selectedSection === "prevention_strategies"
          ? generatedContent?.prevention_strategies.join("\n\n")
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

      // Update the content and rationale
      const rationaleKey = `${selectedSection}_rationale` as keyof GeneratedContent;
      setGeneratedContent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [selectedSection]: data.revisedContent,
          [rationaleKey]: data.rationale,
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

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
    <div className="space-y-4">
      {/* Header with save status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            {allSectionsReviewed
              ? "All sections reviewed. Ready to finalize."
              : "Click any section to review and edit."}
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

      {/* Split Pane Layout - 65/35 */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Plan Document */}
        <div className="lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-4">
          {/* Document Header */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Behavior Plan: {student.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {student.grade_level && (
                    <span>Grade {student.grade_level}</span>
                  )}
                  <span>{formatDate(new Date())}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGeneratedContent(null);
                  setSectionsReviewed([]);
                  setSelectedSection(null);
                  generatePlan();
                }}
                disabled={isGenerating}
                className="shrink-0"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="h-4 w-4 mr-1.5 animate-spin"
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
                    Rebuilding...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 mr-1.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Rebuild Plan
                  </>
                )}
              </Button>
            </div>
            {plan.target_behavior && (
              <p className="mt-3 text-sm">
                <span className="font-medium">Target Behavior:</span>{" "}
                <span className="text-muted-foreground">{plan.target_behavior}</span>
              </p>
            )}
          </div>

          {/* Plan Sections */}
          <div className="space-y-0">
            {sections.map((section, index) => {
              const isSelected = selectedSection === section.id;
              const isReviewed = sectionsReviewed.includes(section.id);
              const isLast = index === sections.length - 1;

              return (
                <div
                  key={section.id}
                  className={cn(
                    "relative py-6 transition-colors",
                    section.editable && "cursor-pointer hover:bg-muted/30",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => handleSectionClick(section.id)}
                >
                  {/* Active indicator - left border */}
                  {isSelected && (
                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-full" />
                  )}

                  <div className={cn(isSelected && "pl-4")}>
                    {/* Section Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          {section.title}
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
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {section.description}
                        </p>
                      </div>
                      {section.editable && !isSelected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 opacity-0 group-hover:opacity-100 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSectionClick(section.id);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>

                    {/* Section Content */}
                    <div className="text-sm text-foreground">
                      <Markdown>{getSectionContent(section.id)}</Markdown>
                    </div>
                  </div>

                  {/* Divider */}
                  {!isLast && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Editor Panel */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <Card className="border-2">
            <CardContent className="p-5">
              {selectedSection ? (
                <div className="space-y-4">
                  {/* Section Header */}
                  <div>
                    <h3 className="font-semibold text-sm">
                      Editing: {sections.find((s) => s.id === selectedSection)?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review and provide feedback for revisions.
                    </p>
                  </div>

                  {/* Behavior Science Rationale */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
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
                      <div>
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Behavior Science Rationale
                        </p>
                        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                          {getSectionRationale(selectedSection)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Feedback Buttons */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Quick suggestions:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickFeedbackOptions.map((option) => (
                        <Button
                          key={option}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => handleQuickFeedback(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Input */}
                  <div>
                    <label className="text-xs font-medium block mb-1.5">
                      What would you like to change?
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g., Make it simpler, add examples..."
                      rows={2}
                      className="text-sm"
                      disabled={isRevising}
                    />
                  </div>

                  {/* Revision Error */}
                  {revisionError && (
                    <p className="text-xs text-destructive">{revisionError}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRevise}
                      disabled={!feedback.trim() || isRevising}
                      className="flex-1"
                      size="sm"
                    >
                      {isRevising ? (
                        <>
                          <svg
                            className="h-3 w-3 mr-1.5 animate-spin"
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
                        "Revise"
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleKeepAsIs}
                      disabled={isRevising}
                      size="sm"
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
                <div className="text-center py-6">
                  <svg
                    className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3"
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
                      ? "All sections reviewed!"
                      : "Click a section to edit"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sectionsReviewed.length} of {sections.filter((s) => s.editable).length} reviewed
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
          <Button variant="ghost" onClick={onBack} size="sm">
            <svg
              className="h-4 w-4 mr-1.5"
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
        <Button
          onClick={handleFinalize}
          disabled={isSaving}
          className="ml-auto"
        >
          {isSaving ? "Saving..." : "Finalize Plan"}
          <svg
            className="h-4 w-4 ml-1.5"
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
  );
}
