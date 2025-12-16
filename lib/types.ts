export interface Student {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  grade_level: string | null;
  about: string | null;
  interests: string | null;
}

export interface Plan {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  student_id: string;
  status: "draft" | "in_progress" | "assessment_complete" | "generating" | "complete";
  target_behavior: string | null;
  behavior_frequency: string | null;
  behavior_intensity: string | null;
  assessment_responses: Record<string, string> | null;
  function_scores: Record<string, number | null> | null;
  calculated_function: string | null;
  determined_function: string | null;
  secondary_function: string | null;
  whats_been_tried: string | null;
  implementer: string | null;
  replacement_behavior: string | null;
  prevention_strategies: string | null;
  reinforcement_plan: string | null;
  response_to_behavior: string | null;
  // Generated content (first AI-generated version)
  generated_function_summary: string | null;
  generated_replacement_behavior: string | null;
  generated_prevention_strategies: string | null;
  generated_reinforcement_plan: string | null;
  generated_response_to_behavior: string | null;
  // Current content (possibly edited by user)
  current_function_summary: string | null;
  current_replacement_behavior: string | null;
  current_prevention_strategies: string | null;
  current_reinforcement_plan: string | null;
  current_response_to_behavior: string | null;
  // Generation tracking
  generation_version: number;
  sections_reviewed: string[];
  finalized_at: string | null;
  revision_counts: Record<string, number>;
}

export type PlanSection =
  | "function_summary"
  | "replacement_behavior"
  | "prevention_strategies"
  | "reinforcement_plan"
  | "response_to_behavior";

export type EditablePlanSection = Exclude<PlanSection, "function_summary">;

export interface PlanSectionRevision {
  id: string;
  created_at: string;
  plan_id: string;
  section_name: PlanSection;
  content: string;
  revision_number: number;
  generation_version: number;
  feedback_given: string | null;
  is_manual_edit: boolean;
}
