import { createClient } from "@/lib/supabase/server";
import { PlansListClient } from "./plans-list-client";

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
    .order("updated_at", { ascending: false });

  return <PlansListClient plans={plans || []} />;
}
