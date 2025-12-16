import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Restore a previous revision as the current content
export async function POST(request: Request) {
  try {
    const { planId, revisionId } = await request.json();

    if (!planId || !revisionId) {
      return NextResponse.json(
        { error: "Plan ID and revision ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the revision to restore
    const { data: revision, error: revisionError } = await supabase
      .from("plan_section_revisions")
      .select("*")
      .eq("id", revisionId)
      .eq("plan_id", planId)
      .single();

    if (revisionError || !revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    // Update the plan's current content for this section
    const updateField = `current_${revision.section_name}`;
    const { error: updateError } = await supabase
      .from("plans")
      .update({
        [updateField]: revision.content,
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error restoring revision:", updateError);
      return NextResponse.json({ error: "Failed to restore revision" }, { status: 500 });
    }

    // Create a new revision record indicating this was a restore
    const { data: plan } = await supabase
      .from("plans")
      .select("generation_version")
      .eq("id", planId)
      .single();

    // Get the latest revision number
    const { data: latestRevision } = await supabase
      .from("plan_section_revisions")
      .select("revision_number")
      .eq("plan_id", planId)
      .eq("section_name", revision.section_name)
      .eq("generation_version", plan?.generation_version || 1)
      .order("revision_number", { ascending: false })
      .limit(1)
      .single();

    const nextRevisionNumber = latestRevision ? latestRevision.revision_number + 1 : 1;

    // Create a restoration revision
    await supabase
      .from("plan_section_revisions")
      .insert({
        plan_id: planId,
        section_name: revision.section_name,
        content: revision.content,
        revision_number: nextRevisionNumber,
        generation_version: plan?.generation_version || 1,
        feedback_given: `Restored from version ${revision.revision_number}`,
        is_manual_edit: false,
      });

    return NextResponse.json({
      success: true,
      restoredContent: revision.content,
      sectionName: revision.section_name,
    });
  } catch (error) {
    console.error("Error restoring revision:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore revision" },
      { status: 500 }
    );
  }
}
