import { createClient } from "@/lib/supabase/server";
import { Student } from "@/lib/types";
import { StudentsClient } from "./students-client";

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching students:", error);
  }

  return <StudentsClient students={(students as Student[]) || []} />;
}
