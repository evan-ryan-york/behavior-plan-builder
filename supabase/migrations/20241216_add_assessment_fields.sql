-- Migration: Add Assessment Fields to Plans
-- Description: Add fields for storing assessment responses, function scores, and calculated function

-- Add assessment_responses field to store individual question responses as JSON
-- Format: {"1": "strongly_agree", "2": "agree", ...}
ALTER TABLE plans ADD COLUMN IF NOT EXISTS assessment_responses JSONB;

-- Add calculated_function field to store the algorithm's determined function
-- This is separate from determined_function which may be overridden by the user
ALTER TABLE plans ADD COLUMN IF NOT EXISTS calculated_function TEXT;

-- Update the status check constraint to include 'assessment_complete'
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;
ALTER TABLE plans ADD CONSTRAINT plans_status_check
  CHECK (status IN ('draft', 'in_progress', 'assessment_complete', 'complete'));
