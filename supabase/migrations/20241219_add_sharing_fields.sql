-- Migration: Add Sharing Fields
-- Description: Add fields for plan sharing functionality

-- Add sharing columns to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS share_created_at TIMESTAMP WITH TIME ZONE;

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_plans_share_token ON plans(share_token) WHERE share_token IS NOT NULL;

-- RLS Policy: Allow public SELECT on shared plans (no auth required)
CREATE POLICY "Anyone can view shared plans by token"
  ON plans
  FOR SELECT
  TO anon
  USING (share_enabled = TRUE AND share_token IS NOT NULL);
