import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getStatusBadgeStyles(status: string) {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress":
    case "assessment_complete":
    case "generating":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "draft":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "assessment_complete":
      return "Assessment Done";
    case "generating":
      return "Generating";
    case "complete":
      return "Complete";
    case "draft":
    default:
      return "Draft";
  }
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
    mild: "Mild — Minor disruption, easily redirected",
    moderate: "Moderate — Significant disruption, requires intervention",
    severe: "Severe — Major disruption, affects entire class or environment",
    safety_concern: "Safety concern — Risk of harm to self or others",
  };
  return map[intensity] || intensity;
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan, error } = await supabase
    .from("plans")
    .select(
      `
      *,
      students (
        id,
        name,
        grade_level,
        about,
        interests
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !plan) {
    notFound();
  }

  const student = plan.students as {
    id: string;
    name: string;
    grade_level: string | null;
    about: string | null;
    interests: string | null;
  } | null;

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/plans"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Plans
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {student?.name || "Unknown Student"}
            </h1>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                getStatusBadgeStyles(plan.status)
              )}
            >
              {formatStatus(plan.status)}
            </span>
          </div>
          {student?.grade_level && (
            <p className="text-muted-foreground">{student.grade_level} Grade</p>
          )}
        </div>
        {plan.status !== "complete" && student && (
          <Button asChild>
            <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
              Continue Plan
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Target Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">
              {plan.target_behavior || "Not specified"}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Frequency</CardTitle>
              <CardDescription>How often does this behavior occur?</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{formatFrequency(plan.behavior_frequency)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intensity</CardTitle>
              <CardDescription>
                How intense is the behavior when it occurs?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{formatIntensity(plan.behavior_intensity)}</p>
            </CardContent>
          </Card>
        </div>

        {plan.status !== "complete" && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
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
              <h3 className="font-semibold text-lg mb-2">Plan In Progress</h3>
              <p className="text-muted-foreground text-sm mb-4">
                This plan is still being created. Continue to add function
                assessment and complete the plan.
              </p>
              {student && (
                <Button asChild>
                  <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
                    Continue Plan
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
