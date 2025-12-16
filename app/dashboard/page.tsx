import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get user for personalized greeting
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch counts and data
  const [studentsResult, plansResult, completePlansResult, inProgressPlansResult, recentPlansResult] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("status", "complete"),
    supabase
      .from("plans")
      .select(
        `
        id,
        target_behavior,
        status,
        updated_at,
        students (
          id,
          name
        )
      `
      )
      .neq("status", "complete")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("plans")
      .select(
        `
        id,
        target_behavior,
        status,
        updated_at,
        finalized_at,
        students (
          id,
          name
        )
      `
      )
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const studentCount = studentsResult.count || 0;
  const planCount = plansResult.count || 0;
  const completePlanCount = completePlansResult.count || 0;
  const inProgressPlans = inProgressPlansResult.data || [];
  const recentPlans = recentPlansResult.data || [];

  // Get first name for greeting
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your students and create behavior intervention plans.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-4xl">{studentCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/students"
              className="text-sm text-primary hover:underline"
            >
              View all students
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Plans</CardDescription>
            <CardTitle className="text-4xl">{planCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/plans"
              className="text-sm text-primary hover:underline"
            >
              View all plans
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-4xl">{inProgressPlans.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-muted-foreground">
              Plans to complete
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-4xl">{completePlanCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-muted-foreground">
              Ready to export
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Continue Where You Left Off */}
      {inProgressPlans.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Continue where you left off</h2>
            <Link
              href="/dashboard/plans?status=in_progress"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgressPlans.slice(0, 3).map((plan) => {
              const studentData = plan.students as unknown as {
                id: string;
                name: string;
              } | null;

              return (
                <Card key={plan.id} className="relative">
                  <div className="absolute top-3 right-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getStatusBadgeStyles(plan.status)
                      )}
                    >
                      {formatStatus(plan.status)}
                    </span>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg pr-20">
                      {studentData?.name || "Unknown Student"}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {plan.target_behavior || "No target behavior defined"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
                        Continue
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentPlans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {recentPlans.map((plan) => {
                const studentData = plan.students as unknown as {
                  id: string;
                  name: string;
                } | null;

                return (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          plan.status === "complete"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        )}
                      />
                      <div>
                        <p className="font-medium">
                          {plan.status === "complete"
                            ? "Completed plan"
                            : "Updated plan"}{" "}
                          for{" "}
                          <span className="font-semibold">
                            {studentData?.name || "Unknown"}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {plan.target_behavior || "No target behavior"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(plan.updated_at)}
                      </span>
                      <Button asChild variant="ghost" size="sm">
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
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <CardTitle>Add Student</CardTitle>
              </div>
              <CardDescription>
                Add a new student to start creating plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/students">Add Student</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <CardTitle>New Plan</CardTitle>
              </div>
              <CardDescription>
                Create a new behavior intervention plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/plans/new">Create Plan</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </div>
                <CardTitle>View Plans</CardTitle>
              </div>
              <CardDescription>
                Browse and manage all your behavior plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/plans">View All Plans</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
