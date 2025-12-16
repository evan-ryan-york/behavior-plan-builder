import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan ownership
  const { data: plan, error: fetchError } = await supabase
    .from("plans")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (plan.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Delete associated revisions first (cascade should handle this, but being explicit)
  await supabase
    .from("plan_section_revisions")
    .delete()
    .eq("plan_id", id);

  // Delete the plan
  const { error: deleteError } = await supabase
    .from("plans")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting plan:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
