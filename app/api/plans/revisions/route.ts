import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch revision history for a specific section
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");
    const sectionName = searchParams.get("sectionName");

    if (!planId || !sectionName) {
      return NextResponse.json(
        { error: "Plan ID and section name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch revisions ordered by revision number descending
    const { data: revisions, error } = await supabase
      .from("plan_section_revisions")
      .select("*")
      .eq("plan_id", planId)
      .eq("section_name", sectionName)
      .order("generation_version", { ascending: false })
      .order("revision_number", { ascending: false });

    if (error) {
      console.error("Error fetching revisions:", error);
      return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 });
    }

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error("Error fetching revisions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch revisions" },
      { status: 500 }
    );
  }
}

// POST - Create a new revision (used internally when generating or revising)
export async function POST(request: Request) {
  try {
    const { planId, sectionName, content, feedbackGiven, isManualEdit } = await request.json();

    if (!planId || !sectionName || !content) {
      return NextResponse.json(
        { error: "Plan ID, section name, and content are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current plan's generation_version
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("generation_version")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get the latest revision number for this section and generation version
    const { data: latestRevision } = await supabase
      .from("plan_section_revisions")
      .select("revision_number")
      .eq("plan_id", planId)
      .eq("section_name", sectionName)
      .eq("generation_version", plan.generation_version)
      .order("revision_number", { ascending: false })
      .limit(1)
      .single();

    const nextRevisionNumber = latestRevision ? latestRevision.revision_number + 1 : 1;

    // Create the revision
    const { data: revision, error: insertError } = await supabase
      .from("plan_section_revisions")
      .insert({
        plan_id: planId,
        section_name: sectionName,
        content,
        revision_number: nextRevisionNumber,
        generation_version: plan.generation_version,
        feedback_given: feedbackGiven || null,
        is_manual_edit: isManualEdit || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating revision:", insertError);
      return NextResponse.json({ error: "Failed to create revision" }, { status: 500 });
    }

    return NextResponse.json({ success: true, revision });
  } catch (error) {
    console.error("Error creating revision:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create revision" },
      { status: 500 }
    );
  }
}
