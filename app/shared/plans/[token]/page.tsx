import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { functionInfo, BehaviorFunction, implementerOptions } from "@/lib/assessment-questions";
import { Markdown } from "@/components/ui/markdown";

interface PageProps {
  params: Promise<{ token: string }>;
}

function formatFrequency(frequency: string | null) {
  if (!frequency) return "Not specified";
  const map: Record<string, string> = {
    multiple_daily: "Multiple times per day",
    once_daily: "About once per day",
    few_weekly: "A few times per week",
    once_weekly: "About once per week",
    less_weekly: "Less than once per week",
  };
  return map[frequency] || frequency;
}

function formatIntensity(intensity: string | null) {
  if (!intensity) return "Not specified";
  const map: Record<string, string> = {
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
    safety_concern: "Safety concern",
  };
  return map[intensity] || intensity;
}

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatFullDate(dateString: string | null) {
  if (!dateString) return "Not specified";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatImplementers(implementer: string | null): string[] {
  if (!implementer) return [];
  try {
    const parsed = JSON.parse(implementer);
    if (Array.isArray(parsed)) {
      return parsed.map((imp: string) => {
        const option = implementerOptions.find((o) => o.value === imp);
        return option?.label || imp;
      });
    }
  } catch {
    const option = implementerOptions.find((o) => o.value === implementer);
    return [option?.label || implementer];
  }
  return [];
}

export default async function SharedPlanPage({ params }: PageProps) {
  const { token } = await params;

  // Create a public (anon) Supabase client for shared access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Fetch the plan by share token
  const { data: plan, error } = await supabase
    .from("plans")
    .select(
      `
      *,
      students (
        id,
        name,
        grade_level
      )
    `
    )
    .eq("share_token", token)
    .eq("share_enabled", true)
    .single();

  if (error || !plan) {
    notFound();
  }

  const student = plan.students as {
    id: string;
    name: string;
    grade_level: string | null;
  } | null;

  const determinedFunction = plan.determined_function as BehaviorFunction | null;
  const secondaryFunction = plan.secondary_function as BehaviorFunction | null;

  // Parse prevention strategies
  let preventionStrategies: string[] = [];
  try {
    const parsed = JSON.parse(plan.current_prevention_strategies || "[]");
    preventionStrategies = Array.isArray(parsed) ? parsed : [];
  } catch {
    preventionStrategies = [];
  }

  const implementers = formatImplementers(plan.implementer);

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Behavior Intervention Plan</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        {/* Plan Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            BEHAVIOR INTERVENTION PLAN
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground">
            <span className="font-medium text-foreground">
              Student: {student?.name || "Unknown Student"}
            </span>
            {student?.grade_level && (
              <>
                <span>|</span>
                <span>Grade: {student.grade_level}</span>
              </>
            )}
            {plan.finalized_at && (
              <>
                <span>|</span>
                <span>Date: {formatDate(plan.finalized_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Plan Content */}
        <div className="space-y-6">
          {/* Target Behavior */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-primary">
                TARGET BEHAVIOR
              </h3>
              <p className="whitespace-pre-wrap mb-4">
                {plan.target_behavior || "Not specified"}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Frequency:</span>{" "}
                  {formatFrequency(plan.behavior_frequency)}
                </span>
                <span>
                  <span className="font-medium text-foreground">Intensity:</span>{" "}
                  {formatIntensity(plan.behavior_intensity)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Function of Behavior */}
          {(determinedFunction || plan.current_function_summary) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  FUNCTION OF BEHAVIOR
                </h3>
                {determinedFunction && (
                  <p className="text-sm mb-3">
                    <span className="font-medium">Primary Function:</span>{" "}
                    {functionInfo[determinedFunction]?.label}
                    {secondaryFunction && (
                      <>
                        {" "}
                        | <span className="font-medium">Secondary:</span>{" "}
                        {functionInfo[secondaryFunction]?.label}
                      </>
                    )}
                  </p>
                )}
                {plan.current_function_summary && (
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <Markdown>{plan.current_function_summary}</Markdown>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Replacement Behavior */}
          {plan.current_replacement_behavior && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  REPLACEMENT BEHAVIOR
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <Markdown>{plan.current_replacement_behavior}</Markdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prevention Strategies */}
          {preventionStrategies.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  PREVENTION STRATEGIES
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <Markdown>{preventionStrategies.join("\n\n")}</Markdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reinforcement Plan */}
          {plan.current_reinforcement_plan && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  REINFORCEMENT PLAN
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <Markdown>{plan.current_reinforcement_plan}</Markdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response to Target Behavior */}
          {plan.current_response_to_behavior && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  RESPONSE TO TARGET BEHAVIOR
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <Markdown>{plan.current_response_to_behavior}</Markdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Details */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-primary">
                PLAN DETAILS
              </h3>
              <div className="grid gap-3 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">Created:</span>{" "}
                    {formatFullDate(plan.created_at)}
                  </span>
                  {plan.finalized_at && (
                    <span>
                      <span className="font-medium text-foreground">Finalized:</span>{" "}
                      {formatFullDate(plan.finalized_at)}
                    </span>
                  )}
                </div>

                {implementers.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Implementers:</span>{" "}
                    <span className="text-muted-foreground">
                      {implementers.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-card">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Created with <span className="font-medium">Behavior Plan Builder</span>
          </p>
          <p className="mt-1">
            <a href="/" className="text-primary hover:underline">
              Create your own behavior intervention plans
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
