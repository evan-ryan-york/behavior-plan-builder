import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Student } from "@/lib/types";
import { StudentDetailClient } from "./student-detail-client";

interface StudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentPage({ params }: StudentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !student) {
    notFound();
  }

  // Fetch plans for this student
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  return (
    <StudentDetailClient
      student={student as Student}
      plans={plans || []}
    />
  );
}
