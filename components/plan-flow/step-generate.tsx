"use client";

import { useState, useEffect, useCallback } from "react";
import { Student, Plan, PlanSectionRevision, EditablePlanSection } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { functionInfo, BehaviorFunction } from "@/lib/assessment-questions";

interface StepGenerateProps {
  student: Student;
  plan: Plan;
  onBack?: () => void;
  onContinue?: (updatedPlan: Plan) => void;
}

// Plan section types
type AllSections = "function_summary" | EditablePlanSection;

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

// Quick feedback options grouped by category
interface FeedbackCategory {
  label: string;
  options: string[];
}

const baseFeedbackCategories: FeedbackCategory[] = [
  {
    label: "Tone & Complexity",
    options: ["Simpler language", "More detailed", "More professional/formal", "More conversational"],
  },
  {
    label: "Specificity",
    options: ["More specific to this student", "More specific examples", "Add step-by-step instructions"],
  },
  {
    label: "Context",
    options: ["Better for general ed classroom", "Better for special ed setting", "Better for home/parents", "Better for one-on-one aide"],
  },
];

// Function-specific feedback options
const functionFeedback: Record<BehaviorFunction, string[]> = {
  attention: ["Less attention for target behavior", "More positive attention strategies"],
  escape: ["Reduce task demands", "Build in more breaks"],
  access: ["Better delay/denial strategies", "Alternative access options"],
  sensory: ["More sensory alternatives", "Better sensory breaks"],
};

// Guided feedback questions per section
interface GuidedQuestion {
  question: string;
  options: { value: string; label: string }[];
  followUp?: string;
}

const guidedQuestions: Record<EditablePlanSection, GuidedQuestion[]> = {
  replacement_behavior: [
    {
      question: "Is this replacement behavior realistic for the student to learn?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not_sure", label: "Not sure" },
      ],
    },
    {
      question: "Does the student already know how to do this?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not_sure", label: "Not sure" },
      ],
    },
    {
      question: "Will this behavior actually meet the same need?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not_sure", label: "Not sure" },
      ],
    },
  ],
  prevention_strategies: [
    {
      question: "Are these strategies realistic in your setting?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "mostly", label: "Mostly" },
        { value: "some_arent", label: "Some aren't" },
        { value: "no", label: "No" },
      ],
    },
  ],
  reinforcement_plan: [
    {
      question: "Will these reinforcers actually motivate this student?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "probably", label: "Probably" },
        { value: "not_sure", label: "Not sure" },
        { value: "no", label: "No" },
      ],
    },
    {
      question: "Is this reinforcement schedule realistic to implement?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "too_frequent", label: "Too frequent" },
        { value: "not_frequent_enough", label: "Not frequent enough" },
      ],
    },
  ],
  response_to_behavior: [
    {
      question: "Is this response realistic when the behavior happens?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      question: "Do you need more specific steps?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  ],
};

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

interface CoherenceIssue {
  coherent: boolean;
  issue?: string;
  suggestion?: string;
}

interface CoherenceResult {
  replacement_behavior: CoherenceIssue;
  prevention_strategies: CoherenceIssue;
  reinforcement_plan: CoherenceIssue;
  response_to_behavior: CoherenceIssue;
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
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // Editor state
  const [selectedSection, setSelectedSection] = useState<EditablePlanSection | null>(null);
  const [feedback, setFeedback] = useState("");
  const [selectedQuickFeedback, setSelectedQuickFeedback] = useState<string[]>([]);
  const [isRevising, setIsRevising] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [sectionsReviewed, setSectionsReviewed] = useState<string[]>([]);

  // Guided feedback state
  const [showGuidedFeedback, setShowGuidedFeedback] = useState(false);
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, string>>({});
  const [guidedFreeform, setGuidedFreeform] = useState("");

  // Revision history state
  const [revisionHistory, setRevisionHistory] = useState<PlanSectionRevision[]>([]);
  const [currentRevisionIndex, setCurrentRevisionIndex] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Manual editing state
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [manualEditContent, setManualEditContent] = useState("");

  // Coherence state
  const [coherenceIssues, setCoherenceIssues] = useState<CoherenceResult | null>(null);
  const [showCoherenceWarning, setShowCoherenceWarning] = useState(false);

  // Finalize state
  const [showFinalReview, setShowFinalReview] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Get revision counts
  const revisionCounts = plan.revision_counts || {};

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

      setSectionsReviewed(Array.isArray(plan.sections_reviewed) ? plan.sections_reviewed : []);
    } else {
      // Generate new plan
      generatePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load revision history when section is selected
  useEffect(() => {
    if (selectedSection) {
      loadRevisionHistory(selectedSection);
    }
  }, [selectedSection]);

  const loadRevisionHistory = async (sectionName: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/plans/revisions?planId=${plan.id}&sectionName=${sectionName}`
      );
      if (response.ok) {
        const data = await response.json();
        setRevisionHistory(data.revisions || []);
        setCurrentRevisionIndex(null);
      }
    } catch (error) {
      console.error("Error loading revision history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

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
      setGenerationError(error instanceof Error ? error.message : "Failed to generate plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSectionClick = (sectionId: AllSections) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section?.editable) {
      setSelectedSection(sectionId as EditablePlanSection);
      setFeedback("");
      setSelectedQuickFeedback([]);
      setRevisionError(null);
      setShowGuidedFeedback(false);
      setGuidedAnswers({});
      setGuidedFreeform("");
      setIsManualEditing(false);
      setCurrentRevisionIndex(null);
    }
  };

  const getSectionContent = (sectionId: AllSections): string => {
    if (!generatedContent) return "";

    if (sectionId === "prevention_strategies") {
      return generatedContent.prevention_strategies.join("\n\n");
    }

    return generatedContent[sectionId] || "";
  };

  const getSectionRationale = (sectionId: EditablePlanSection): string => {
    if (!generatedContent) return "";
    const rationaleKey = `${sectionId}_rationale` as keyof GeneratedContent;
    return (generatedContent[rationaleKey] as string) || "";
  };

  // Build combined feedback from quick selections and freeform
  const buildCombinedFeedback = (): string => {
    const parts: string[] = [];

    if (selectedQuickFeedback.length > 0) {
      parts.push(selectedQuickFeedback.join(". "));
    }

    if (feedback.trim()) {
      parts.push(feedback.trim());
    }

    return parts.join(". ") || "";
  };

  // Build feedback from guided questions
  const buildGuidedFeedback = (): string => {
    if (!selectedSection) return "";

    const parts: string[] = [];
    const questions = guidedQuestions[selectedSection];

    questions.forEach((q, index) => {
      const answer = guidedAnswers[index.toString()];
      if (answer && answer !== "yes") {
        // Generate feedback based on negative/uncertain answers
        if (selectedSection === "replacement_behavior") {
          if (index === 0 && answer !== "yes") {
            parts.push("The user indicated the replacement behavior may not be realistic for the student to learn. Suggest a simpler alternative that requires less skill.");
          } else if (index === 1 && answer === "yes") {
            parts.push("The student already knows this behavior, so focus on prompting and reinforcement rather than teaching.");
          } else if (index === 2 && answer !== "yes") {
            parts.push("The replacement behavior may not meet the same need. Ensure the alternative serves the same function.");
          }
        } else if (selectedSection === "prevention_strategies") {
          if (answer !== "yes") {
            parts.push("Some strategies may not be realistic for this setting. Make them more practical and easier to implement.");
          }
        } else if (selectedSection === "reinforcement_plan") {
          if (index === 0 && answer !== "yes") {
            parts.push("These reinforcers may not motivate this student. Consider their specific interests and preferences.");
          } else if (index === 1 && answer === "too_frequent") {
            parts.push("The reinforcement schedule is too frequent. Make it more sustainable for implementers.");
          } else if (index === 1 && answer === "not_frequent_enough") {
            parts.push("Increase reinforcement frequency, especially during initial teaching.");
          }
        } else if (selectedSection === "response_to_behavior") {
          if (index === 0 && answer === "no") {
            parts.push("These response steps are not realistic. Simplify them for when the behavior occurs.");
          } else if (index === 1 && answer === "yes") {
            parts.push("Add more specific, step-by-step instructions for responding to the behavior.");
          }
        }
      }
    });

    if (guidedFreeform.trim()) {
      parts.push(guidedFreeform.trim());
    }

    return parts.join(" ");
  };

  const handleRevise = async () => {
    if (!selectedSection) return;

    const combinedFeedback = showGuidedFeedback ? buildGuidedFeedback() : buildCombinedFeedback();

    if (!combinedFeedback.trim()) return;

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
          userFeedback: combinedFeedback,
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

      // Clear feedback
      setFeedback("");
      setSelectedQuickFeedback([]);
      setShowGuidedFeedback(false);
      setGuidedAnswers({});
      setGuidedFreeform("");

      // Reload history
      await loadRevisionHistory(selectedSection);

      // Run coherence check in background
      runCoherenceCheck(selectedSection);

      // Advance to next section
      advanceToNextSection();
    } catch (error) {
      setRevisionError(error instanceof Error ? error.message : "Failed to revise section");
    } finally {
      setIsRevising(false);
    }
  };

  const handleManualEditSave = async () => {
    if (!selectedSection || !manualEditContent.trim()) return;

    setIsRevising(true);
    setRevisionError(null);

    try {
      const contentToSave =
        selectedSection === "prevention_strategies"
          ? JSON.stringify(manualEditContent.split("\n\n").filter(Boolean))
          : manualEditContent;

      const response = await fetch("/api/plans/revise-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          sectionName: selectedSection,
          currentContent: contentToSave,
          isManualEdit: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save manual edit");
      }

      // Update the content
      setGeneratedContent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [selectedSection]: data.revisedContent,
        };
      });

      setIsManualEditing(false);
      markSectionReviewed(selectedSection);
      await loadRevisionHistory(selectedSection);
      runCoherenceCheck(selectedSection);
    } catch (error) {
      setRevisionError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsRevising(false);
    }
  };

  const runCoherenceCheck = async (revisedSection: string) => {
    try {
      const response = await fetch("/api/plans/coherence-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          revisedSection,
        }),
      });

      const data = await response.json();

      if (data.hasIssues && data.coherenceCheck) {
        setCoherenceIssues(data.coherenceCheck);
        setShowCoherenceWarning(true);
      } else {
        setCoherenceIssues(null);
        setShowCoherenceWarning(false);
      }
    } catch (error) {
      console.error("Coherence check failed:", error);
      // Silently fail
    }
  };

  const handleRestoreRevision = async (revisionId: string) => {
    try {
      const response = await fetch("/api/plans/revisions/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          revisionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to restore revision");
      }

      // Update the content
      if (selectedSection && data.restoredContent) {
        let restoredValue = data.restoredContent;
        if (selectedSection === "prevention_strategies") {
          try {
            restoredValue = JSON.parse(data.restoredContent);
          } catch {
            restoredValue = [];
          }
        }

        setGeneratedContent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [selectedSection]: restoredValue,
          };
        });
      }

      setCurrentRevisionIndex(null);
      await loadRevisionHistory(selectedSection!);
    } catch (error) {
      console.error("Error restoring revision:", error);
    }
  };

  const handleKeepAsIs = () => {
    if (!selectedSection) return;
    markSectionReviewed(selectedSection);
    advanceToNextSection();
  };

  const handleResetToOriginal = async () => {
    if (!selectedSection) return;

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
          await loadRevisionHistory(selectedSection);
        }
      } catch (error) {
        console.error("Error resetting section:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const markSectionReviewed = useCallback(
    async (sectionId: EditablePlanSection) => {
      if (!sectionsReviewed.includes(sectionId)) {
        const newReviewed = [...sectionsReviewed, sectionId];
        setSectionsReviewed(newReviewed);

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
    const currentIndex = editableSections.findIndex((s) => s.id === selectedSection);

    if (currentIndex < editableSections.length - 1) {
      setSelectedSection(editableSections[currentIndex + 1].id as EditablePlanSection);
    } else {
      setSelectedSection(null);
    }
    setFeedback("");
    setSelectedQuickFeedback([]);
    setRevisionError(null);
    setShowGuidedFeedback(false);
    setGuidedAnswers({});
    setGuidedFreeform("");
    setCurrentRevisionIndex(null);
  };

  const toggleQuickFeedback = (option: string) => {
    setSelectedQuickFeedback((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const allSectionsReviewed =
    sectionsReviewed.length === sections.filter((s) => s.editable).length;

  const handleFinalize = async () => {
    if (!generatedContent) return;

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get function-specific feedback for determined function
  const determinedFunction = plan.determined_function as BehaviorFunction | null;
  const secondaryFunction = plan.secondary_function as BehaviorFunction | null;
  const functionSpecificFeedback = determinedFunction ? functionFeedback[determinedFunction] : [];

  // Loading state
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Generating Behavior Plan</h2>
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
                <p className="text-sm font-medium">Analyzing assessment results...</p>
                <p className="text-xs text-muted-foreground">This may take a moment</p>
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
          <h2 className="text-2xl font-bold tracking-tight">Generation Error</h2>
          <p className="text-muted-foreground mt-2">
            Something went wrong while generating the plan.
          </p>
        </div>
        <Card className="max-w-2xl mx-auto border-destructive">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
              <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{generationError}</p>
            <Button onClick={generatePlan}>Try Again</Button>
          </CardContent>
        </Card>
        {onBack && (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={onBack}>Go Back</Button>
          </div>
        )}
      </div>
    );
  }

  // Final review modal
  if (showFinalReview) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Final Review</h2>
          <p className="text-muted-foreground mt-2">Everything look good?</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
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

          {/* Plan Sections */}
          {sections.map((section) => (
            <Card key={section.id}>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">{section.title}</h4>
                <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                  <Markdown>{getSectionContent(section.id)}</Markdown>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button variant="outline" onClick={() => setShowFinalReview(false)}>
            Go Back and Edit
          </Button>
          <Button onClick={handleFinalize} disabled={isSaving}>
            {isSaving ? "Finalizing..." : "Finalize Plan"}
          </Button>
        </div>
      </div>
    );
  }

  // Main editor interface
  return (
    <div className="space-y-4">
      {/* Multiple Functions Banner */}
      {secondaryFunction && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Multiple Behavior Functions Detected
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">
                This plan addresses both <strong>{functionInfo[plan.determined_function as BehaviorFunction]?.label}</strong> and <strong>{functionInfo[secondaryFunction]?.label}</strong> functions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Coherence Warning Banner */}
      {showCoherenceWarning && coherenceIssues && (
        <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  This change may affect other sections
                </p>
                <p className="text-xs text-orange-800 dark:text-orange-200 mt-0.5">
                  Review highlighted sections to ensure consistency.
                </p>
              </div>
            </div>
            <button onClick={() => setShowCoherenceWarning(false)} className="text-orange-600 hover:text-orange-800">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : lastSaved ? (
            <span>Saved</span>
          ) : null}
        </div>
      </div>

      {/* Completion Checklist */}
      <div className="flex flex-wrap gap-2 text-sm">
        {sections.filter(s => s.editable).map((section) => {
          const isReviewed = sectionsReviewed.includes(section.id);
          const revCount = revisionCounts[section.id] || 0;
          const hasCoherenceIssue = coherenceIssues && !coherenceIssues[section.id as keyof CoherenceResult]?.coherent;

          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                isReviewed
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : hasCoherenceIssue
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {isReviewed ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : hasCoherenceIssue ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                </svg>
              )}
              {section.title.split(" ")[0]}
              {revCount > 0 && (
                <span className="text-[10px] opacity-70">({revCount})</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Split Pane Layout */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Left: Plan Document */}
        <div className="lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-4">
          {/* Document Header */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Behavior Plan: {student.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {student.grade_level && <span>Grade {student.grade_level}</span>}
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
                    <svg className="h-4 w-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Rebuilding...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
              const hasCoherenceIssue = coherenceIssues && !coherenceIssues[section.id as keyof CoherenceResult]?.coherent;

              return (
                <div
                  key={section.id}
                  className={cn(
                    "relative py-6 transition-colors",
                    section.editable && "cursor-pointer hover:bg-muted/30",
                    isSelected && "bg-primary/5",
                    hasCoherenceIssue && !isSelected && "bg-orange-50/50 dark:bg-orange-950/20"
                  )}
                  onClick={() => handleSectionClick(section.id)}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-full" />
                  )}

                  <div className={cn(isSelected && "pl-4")}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          {section.title}
                          {isReviewed && section.editable && (
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {hasCoherenceIssue && (
                            <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                      </div>
                    </div>

                    <div className="text-sm text-foreground">
                      <Markdown>{getSectionContent(section.id)}</Markdown>
                    </div>
                  </div>

                  {!isLast && <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />}
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

                  {/* Revision Count Warning */}
                  {(revisionCounts[selectedSection] || 0) >= 3 && (revisionCounts[selectedSection] || 0) < 5 && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        You&apos;ve revised this section several times. Try being more specific about what&apos;s missing.
                      </p>
                    </div>
                  )}
                  {(revisionCounts[selectedSection] || 0) >= 5 && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Having trouble? You can{" "}
                        <button
                          className="underline font-medium"
                          onClick={() => {
                            setIsManualEditing(true);
                            setManualEditContent(getSectionContent(selectedSection));
                          }}
                        >
                          edit directly
                        </button>
                        .
                      </p>
                    </div>
                  )}

                  {/* Manual Editing Mode */}
                  {isManualEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={manualEditContent}
                        onChange={(e) => setManualEditContent(e.target.value)}
                        rows={10}
                        className="text-sm font-mono"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleManualEditSave} disabled={isRevising} size="sm" className="flex-1">
                          {isRevising ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsManualEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Revision History Navigation */}
                      {revisionHistory.length > 1 && (
                        <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                          <button
                            onClick={() => {
                              const newIndex = currentRevisionIndex === null
                                ? 1
                                : Math.min(currentRevisionIndex + 1, revisionHistory.length - 1);
                              setCurrentRevisionIndex(newIndex);
                            }}
                            disabled={currentRevisionIndex === revisionHistory.length - 1}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-xs text-muted-foreground">
                            Version {currentRevisionIndex === null
                              ? revisionHistory.length
                              : revisionHistory.length - currentRevisionIndex} of {revisionHistory.length}
                          </span>
                          <button
                            onClick={() => {
                              if (currentRevisionIndex === 0) {
                                setCurrentRevisionIndex(null);
                              } else if (currentRevisionIndex !== null) {
                                setCurrentRevisionIndex(currentRevisionIndex - 1);
                              }
                            }}
                            disabled={currentRevisionIndex === null}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Viewing Previous Version */}
                      {currentRevisionIndex !== null && revisionHistory[currentRevisionIndex] && (
                        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs font-medium">Previous Version</p>
                          {revisionHistory[currentRevisionIndex].feedback_given && (
                            <p className="text-xs text-muted-foreground">
                              Feedback: {revisionHistory[currentRevisionIndex].feedback_given}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleRestoreRevision(revisionHistory[currentRevisionIndex!].id)}
                          >
                            Restore This Version
                          </Button>
                        </div>
                      )}

                      {/* Behavior Science Rationale */}
                      {currentRevisionIndex === null && (
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
                          <div className="flex items-start gap-2">
                            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
                      )}

                      {/* Toggle between modes */}
                      {currentRevisionIndex === null && (
                        <div className="flex gap-2">
                          <button
                            className={cn(
                              "flex-1 text-xs py-1.5 px-2 rounded transition-colors",
                              !showGuidedFeedback
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            )}
                            onClick={() => setShowGuidedFeedback(false)}
                          >
                            Quick Feedback
                          </button>
                          <button
                            className={cn(
                              "flex-1 text-xs py-1.5 px-2 rounded transition-colors",
                              showGuidedFeedback
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            )}
                            onClick={() => setShowGuidedFeedback(true)}
                          >
                            Help Me Improve
                          </button>
                        </div>
                      )}

                      {currentRevisionIndex === null && !showGuidedFeedback && (
                        <>
                          {/* Quick Feedback Categories */}
                          <div className="space-y-3">
                            {baseFeedbackCategories.map((category) => (
                              <div key={category.label}>
                                <p className="text-xs text-muted-foreground mb-1.5">{category.label}</p>
                                <div className="flex flex-wrap gap-1">
                                  {category.options.map((option) => (
                                    <Button
                                      key={option}
                                      variant={selectedQuickFeedback.includes(option) ? "default" : "outline"}
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={() => toggleQuickFeedback(option)}
                                    >
                                      {option}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Function-specific feedback */}
                            {functionSpecificFeedback.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1.5">
                                  Function-Specific ({functionInfo[determinedFunction!]?.label})
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {functionSpecificFeedback.map((option) => (
                                    <Button
                                      key={option}
                                      variant={selectedQuickFeedback.includes(option) ? "default" : "outline"}
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={() => toggleQuickFeedback(option)}
                                    >
                                      {option}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Freeform Feedback */}
                          <div>
                            <label className="text-xs font-medium block mb-1.5">Additional feedback (optional)</label>
                            <Textarea
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              placeholder="e.g., Marcus responds well to countdowns..."
                              rows={2}
                              className="text-sm"
                              disabled={isRevising}
                            />
                          </div>
                        </>
                      )}

                      {/* Guided Feedback Mode */}
                      {currentRevisionIndex === null && showGuidedFeedback && (
                        <div className="space-y-4">
                          {guidedQuestions[selectedSection].map((q, index) => (
                            <div key={index}>
                              <p className="text-xs font-medium mb-2">{q.question}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {q.options.map((opt) => (
                                  <Button
                                    key={opt.value}
                                    variant={guidedAnswers[index.toString()] === opt.value ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() =>
                                      setGuidedAnswers((prev) => ({
                                        ...prev,
                                        [index.toString()]: opt.value,
                                      }))
                                    }
                                  >
                                    {opt.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div>
                            <label className="text-xs font-medium block mb-1.5">Anything else?</label>
                            <Textarea
                              value={guidedFreeform}
                              onChange={(e) => setGuidedFreeform(e.target.value)}
                              placeholder="Optional additional context..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {/* Revision Error */}
                      {revisionError && <p className="text-xs text-destructive">{revisionError}</p>}

                      {/* Action Buttons */}
                      {currentRevisionIndex === null && (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleRevise}
                            disabled={
                              isRevising ||
                              (showGuidedFeedback
                                ? Object.keys(guidedAnswers).length === 0 && !guidedFreeform.trim()
                                : selectedQuickFeedback.length === 0 && !feedback.trim())
                            }
                            className="flex-1"
                            size="sm"
                          >
                            {isRevising ? (
                              <>
                                <svg className="h-3 w-3 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Revising...
                              </>
                            ) : (
                              "Revise"
                            )}
                          </Button>
                          <Button variant="secondary" onClick={handleKeepAsIs} disabled={isRevising} size="sm">
                            Keep As Is
                          </Button>
                        </div>
                      )}

                      {/* Secondary Actions */}
                      {currentRevisionIndex === null && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                            onClick={handleResetToOriginal}
                            disabled={isRevising}
                          >
                            Reset to original
                          </button>
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                            onClick={() => {
                              setIsManualEditing(true);
                              setManualEditContent(getSectionContent(selectedSection));
                            }}
                          >
                            Edit directly
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    {allSectionsReviewed ? "All sections reviewed!" : "Click a section to edit"}
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
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        )}
        <Button
          onClick={() => {
            if (allSectionsReviewed) {
              setShowFinalReview(true);
            } else {
              handleFinalize();
            }
          }}
          disabled={isSaving}
          className={cn("ml-auto", allSectionsReviewed && "bg-green-600 hover:bg-green-700")}
        >
          {isSaving ? "Saving..." : allSectionsReviewed ? "Review & Finalize" : "Finalize Plan"}
          <svg className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
