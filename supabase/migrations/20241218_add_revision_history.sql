-- Migration: Add Revision History for Plan Sections
-- Description: Track revision history per section with version navigation

-- Create the plan_section_revisions table
CREATE TABLE IF NOT EXISTS plan_section_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  content TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  generation_version INTEGER DEFAULT 1,
  feedback_given TEXT,
  is_manual_edit BOOLEAN DEFAULT FALSE,

  CONSTRAINT valid_section_name CHECK (
    section_name IN (
      'function_summary',
      'replacement_behavior',
      'prevention_strategies',
      'reinforcement_plan',
      'response_to_behavior'
    )
  )
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_plan_section_revisions_plan_id
  ON plan_section_revisions(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_section_revisions_section
  ON plan_section_revisions(plan_id, section_name);
CREATE INDEX IF NOT EXISTS idx_plan_section_revisions_version
  ON plan_section_revisions(plan_id, section_name, generation_version, revision_number);

-- Add finalized_at column to plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- Add secondary_function column to plans for multiple function handling
ALTER TABLE plans ADD COLUMN IF NOT EXISTS secondary_function TEXT;

-- Add revision counts per section for tracking revision attempts
ALTER TABLE plans ADD COLUMN IF NOT EXISTS revision_counts JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on the new table
ALTER TABLE plan_section_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only SELECT revisions for their own plans
CREATE POLICY "Users can view their own plan revisions"
  ON plan_section_revisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_section_revisions.plan_id
      AND plans.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only INSERT revisions for their own plans
CREATE POLICY "Users can insert revisions for their own plans"
  ON plan_section_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_section_revisions.plan_id
      AND plans.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can DELETE their own plan revisions (for clear history feature)
CREATE POLICY "Users can delete their own plan revisions"
  ON plan_section_revisions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_section_revisions.plan_id
      AND plans.user_id = auth.uid()
    )
  );

-- No UPDATE policy - revisions are immutable
