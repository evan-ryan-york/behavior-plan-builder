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
  status: "draft" | "in_progress" | "assessment_complete" | "complete";
  target_behavior: string | null;
  behavior_frequency: string | null;
  behavior_intensity: string | null;
  assessment_responses: Record<string, string> | null;
  function_scores: Record<string, number | null> | null;
  calculated_function: string | null;
  determined_function: string | null;
  whats_been_tried: string | null;
  implementer: string | null;
  replacement_behavior: string | null;
  prevention_strategies: string | null;
  reinforcement_plan: string | null;
  response_to_behavior: string | null;
}
