import { createClient } from "@/lib/supabase/server";
import { PlanCreationFlow } from "./plan-creation-flow";
import { Plan, Student } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ studentId?: string; planId?: string }>;
}

export default async function NewPlanPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("name", { ascending: true });

  // If planId is provided, load the existing plan and its student
  let existingPlan: Plan | null = null;
  let existingStudent: Student | null = null;

  if (params.planId) {
    const { data: plan } = await supabase
      .from("plans")
      .select(
        `
        *,
        students (*)
      `
      )
      .eq("id", params.planId)
      .single();

    if (plan) {
      existingPlan = plan as Plan;
      existingStudent = plan.students as Student;
    }
  }

  return (
    <PlanCreationFlow
      students={students || []}
      preselectedStudentId={params.studentId}
      existingPlan={existingPlan}
      existingStudent={existingStudent}
    />
  );
}
