-- Migration: Add Plan Generation Fields
-- Description: Add fields for storing generated and current plan content

-- Generated content (first AI-generated version)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS generated_function_summary TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS generated_replacement_behavior TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS generated_prevention_strategies TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS generated_reinforcement_plan TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS generated_response_to_behavior TEXT;

-- Current content (possibly edited by user)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS current_function_summary TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS current_replacement_behavior TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS current_prevention_strategies TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS current_reinforcement_plan TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS current_response_to_behavior TEXT;

-- Generation tracking
ALTER TABLE plans ADD COLUMN IF NOT EXISTS generation_version INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS sections_reviewed JSONB DEFAULT '[]'::jsonb;
