import { createClient } from "@/lib/supabase/server";
import { PlanCreationFlow } from "./plan-creation-flow";

interface PageProps {
  searchParams: Promise<{ studentId?: string }>;
}

export default async function NewPlanPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("name", { ascending: true });

  return (
    <PlanCreationFlow
      students={students || []}
      preselectedStudentId={params.studentId}
    />
  );
}
