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

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch counts and in-progress plans
  const [studentsResult, plansResult, inProgressPlansResult] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id", { count: "exact", head: true }),
    supabase
      .from("plans")
      .select(
        `
        id,
        target_behavior,
        created_at,
        students (
          id,
          name
        )
      `
      )
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const studentCount = studentsResult.count || 0;
  const planCount = plansResult.count || 0;
  const inProgressPlans = inProgressPlansResult.data || [];

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to your dashboard
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
            <CardDescription>Quick Action</CardDescription>
            <CardTitle className="text-lg mt-2">Create New Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/dashboard/plans/new">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Plans Section */}
      {inProgressPlans.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Continue where you left off</h2>
            <Link
              href="/dashboard/plans"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all plans
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgressPlans.map((plan) => {
              const studentData = plan.students as unknown as {
                id: string;
                name: string;
              } | null;

              return (
                <Card key={plan.id} className="relative">
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      In Progress
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
                      <Link
                        href={`/dashboard/plans/new?studentId=${studentData?.id}`}
                      >
                        Continue Plan
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Students</CardTitle>
              <CardDescription>
                View and manage your student profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/students">View Students</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Behavior Plans</CardTitle>
              <CardDescription>
                Access your behavior intervention plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/plans">View Plans</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Plan</CardTitle>
              <CardDescription>
                Start a new behavior intervention plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/plans/new">New Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
