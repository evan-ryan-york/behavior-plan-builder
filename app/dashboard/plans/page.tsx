import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
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
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Plans</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your behavior intervention plans
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plans/new">New Plan</Link>
        </Button>
      </div>

      {!plans || plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No behavior plans yet. Create your first plan to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/plans/new">Create New Plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => {
            const student = plan.students as {
              id: string;
              name: string;
              grade_level: string | null;
            } | null;

            return (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg truncate">
                          {student?.name || "Unknown Student"}
                        </CardTitle>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            getStatusBadgeStyles(plan.status)
                          )}
                        >
                          {formatStatus(plan.status)}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {plan.target_behavior || "No target behavior defined"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(plan.created_at)}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={
                            plan.status === "complete"
                              ? `/dashboard/plans/${plan.id}`
                              : `/dashboard/plans/new?planId=${plan.id}`
                          }
                        >
                          {plan.status === "complete" ? "View" : "Continue"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
