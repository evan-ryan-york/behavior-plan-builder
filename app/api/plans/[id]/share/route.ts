import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

// POST - Create or get share link
export async function POST(
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

  // Check plan ownership and get existing share info
  const { data: plan, error: fetchError } = await supabase
    .from("plans")
    .select("id, user_id, share_token, share_enabled")
    .eq("id", id)
    .single();

  if (fetchError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (plan.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // If already has a share token and is enabled, return it
  if (plan.share_token && plan.share_enabled) {
    return NextResponse.json({
      share_token: plan.share_token,
      share_enabled: true,
    });
  }

  // Generate new share token
  const shareToken = nanoid(21);

  const { error: updateError } = await supabase
    .from("plans")
    .update({
      share_token: shareToken,
      share_enabled: true,
      share_created_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error creating share link:", updateError);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    share_token: shareToken,
    share_enabled: true,
  });
}

// DELETE - Disable sharing
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

  // Disable sharing (keep the token for potential re-enable)
  const { error: updateError } = await supabase
    .from("plans")
    .update({
      share_enabled: false,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error disabling sharing:", updateError);
    return NextResponse.json(
      { error: "Failed to disable sharing" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
