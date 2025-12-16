// Function Assessment Questions
// These 21 questions help determine why a student engages in a target behavior
// Each question maps to one of four function categories

export type BehaviorFunction =
  | "escape"
  | "attention"
  | "access"
  | "sensory";

export type ResponseValue =
  | "strongly_agree"
  | "agree"
  | "disagree"
  | "n_a";

export interface AssessmentQuestion {
  number: number;
  text: string;
  function: BehaviorFunction;
}

// Response options with their numeric values for scoring
export const responseOptions: {
  value: ResponseValue;
  label: string;
  score: number | null;
}[] = [
  { value: "strongly_agree", label: "Strongly Agree", score: 3 },
  { value: "agree", label: "Agree", score: 2 },
  { value: "disagree", label: "Disagree", score: 1 },
  { value: "n_a", label: "N/A", score: null },
];

// Function labels and descriptions for display
export const functionInfo: Record<
  BehaviorFunction,
  { label: string; description: string }
> = {
  escape: {
    label: "Escape/Avoidance",
    description:
      "[Student] may engage in this behavior to avoid or get away from tasks, demands, or situations they find difficult, boring, or unpleasant.",
  },
  attention: {
    label: "Attention",
    description:
      "[Student] may engage in this behavior to get a response or interaction from others, whether positive or negative attention.",
  },
  access: {
    label: "Access to Tangibles",
    description:
      "[Student] may engage in this behavior to obtain items, activities, or privileges they want.",
  },
  sensory: {
    label: "Sensory/Automatic",
    description:
      "[Student] may engage in this behavior because it provides sensory input or feels good, regardless of what's happening around them or who is present.",
  },
};

// The 21 assessment questions with their function mapping
// [Student] will be replaced with the actual student's name when displayed
export const assessmentQuestions: AssessmentQuestion[] = [
  {
    number: 1,
    text: "[Student] engages in the behavior when [Student] does not understand what someone is asking them to do.",
    function: "escape",
  },
  {
    number: 2,
    text: "When [Student] engages in this behavior, it appears [Student] is saying, 'I don't want to do this.'",
    function: "escape",
  },
  {
    number: 3,
    text: "[Student] engages in the behavior because you are paying attention to someone else.",
    function: "attention",
  },
  {
    number: 4,
    text: "[Student] engages in the behavior when you are busy.",
    function: "attention",
  },
  {
    number: 5,
    text: "[Student] engages in the behavior so you will tell them to stop.",
    function: "attention",
  },
  {
    number: 6,
    text: "[Student] looks to see if you react when they do the behavior.",
    function: "attention",
  },
  {
    number: 7,
    text: "[Student] engages in this behavior when asked to do something [Student] does not want to do.",
    function: "escape",
  },
  {
    number: 8,
    text: "[Student] engages in the behavior when something [Student] wants is taken away (i.e., toy, game, food, etc.) or something [Student] is doing is interrupted (i.e., game, TV turned off, etc.).",
    function: "access",
  },
  {
    number: 9,
    text: "When you provide the toy/food/activity [Student] wants, [Student] stops engaging in the behavior.",
    function: "access",
  },
  {
    number: 10,
    text: "[Student] engages in behavior while alone.",
    function: "sensory",
  },
  {
    number: 11,
    text: "[Student] engages in the behavior when asked to complete a task (i.e., schoolwork, household chore, daily hygiene, etc.).",
    function: "escape",
  },
  {
    number: 12,
    text: "[Student] engages in the behavior when [Student] is told to stop or wait for a preferred activity.",
    function: "access",
  },
  {
    number: 13,
    text: "[Student] engages in the behavior when [Student] does not get what [Student] wants.",
    function: "access",
  },
  {
    number: 14,
    text: "[Student] engages in the behavior so other people will pay attention to them.",
    function: "attention",
  },
  {
    number: 15,
    text: "[Student] engages in target behavior while alone.",
    function: "sensory",
  },
  {
    number: 16,
    text: "[Student] engages in the behavior to get away from work/demand situations.",
    function: "escape",
  },
  {
    number: 17,
    text: "When [Student] engages in the behavior, [Student] appears to be saying, 'I want that' or 'Give it to me.'",
    function: "access",
  },
  {
    number: 18,
    text: "[Student] engages in the behavior when [Student] is bored or under-stimulated.",
    function: "sensory",
  },
  {
    number: 19,
    text: "[Student] engages in the behavior when [Student] is really happy or excited.",
    function: "sensory",
  },
  {
    number: 20,
    text: "[Student] seems not to care if anyone sees them engage in the behavior.",
    function: "sensory",
  },
  {
    number: 21,
    text: "[Student] engages in the behavior regardless of location or activity.",
    function: "sensory",
  },
];

// Helper function to replace [Student] placeholder with actual name
export function formatQuestionText(
  questionText: string,
  studentName: string
): string {
  return questionText.replace(/\[Student\]/g, studentName);
}

// Scoring types
export type AssessmentResponses = Record<string, ResponseValue>;

export interface FunctionScores {
  escape: number | null;
  attention: number | null;
  access: number | null;
  sensory: number | null;
}

// Calculate scores for each function based on responses
export function calculateFunctionScores(
  responses: AssessmentResponses
): FunctionScores {
  const functionQuestions: Record<BehaviorFunction, number[]> = {
    escape: [1, 2, 7, 11, 16],
    attention: [3, 4, 5, 6, 14],
    access: [8, 9, 12, 13, 17],
    sensory: [10, 15, 18, 19, 20, 21],
  };

  const scores: FunctionScores = {
    escape: null,
    attention: null,
    access: null,
    sensory: null,
  };

  for (const func of Object.keys(functionQuestions) as BehaviorFunction[]) {
    const questionNumbers = functionQuestions[func];
    let total = 0;
    let count = 0;

    for (const qNum of questionNumbers) {
      const response = responses[qNum.toString()];
      if (response && response !== "n_a") {
        const option = responseOptions.find((o) => o.value === response);
        if (option && option.score !== null) {
          total += option.score;
          count++;
        }
      }
    }

    // Only calculate average if at least one question was answered (not N/A)
    if (count > 0) {
      scores[func] = Math.round((total / count) * 100) / 100; // Round to 2 decimal places
    }
  }

  return scores;
}

// Determine the primary function from scores
// Returns the function with highest score, or "multiple" if tied/close (within 0.3)
export interface FunctionDetermination {
  primary: BehaviorFunction | "multiple";
  tiedFunctions?: BehaviorFunction[];
  allScores: FunctionScores;
}

export function determinePrimaryFunction(
  scores: FunctionScores
): FunctionDetermination {
  const validScores: { func: BehaviorFunction; score: number }[] = [];

  for (const func of Object.keys(scores) as BehaviorFunction[]) {
    const score = scores[func];
    if (score !== null) {
      validScores.push({ func, score });
    }
  }

  // If no valid scores, return multiple with empty tied functions
  if (validScores.length === 0) {
    return {
      primary: "multiple",
      tiedFunctions: [],
      allScores: scores,
    };
  }

  // Sort by score descending
  validScores.sort((a, b) => b.score - a.score);

  const highest = validScores[0];
  const THRESHOLD = 0.3;
  const MIN_SCORE_FOR_TIE = 2.0;

  // Find functions that are tied or close (within threshold) to the highest
  const closeFunctions = validScores.filter(
    (v) =>
      v.score >= highest.score - THRESHOLD &&
      v.score >= MIN_SCORE_FOR_TIE
  );

  if (closeFunctions.length > 1) {
    return {
      primary: "multiple",
      tiedFunctions: closeFunctions.map((v) => v.func),
      allScores: scores,
    };
  }

  return {
    primary: highest.func,
    allScores: scores,
  };
}

// Implementer options for the follow-up question
export const implementerOptions = [
  { value: "general_ed_teacher", label: "General education teacher" },
  { value: "special_ed_teacher", label: "Special education teacher" },
  { value: "paraprofessional", label: "Paraprofessional/Aide" },
  { value: "counselor", label: "School counselor" },
  { value: "behavior_specialist", label: "Behavior specialist" },
  { value: "parent_guardian", label: "Parent/Guardian" },
];
