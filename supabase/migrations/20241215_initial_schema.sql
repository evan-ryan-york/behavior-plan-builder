-- Migration: Initial Schema
-- Description: Create students and plans tables with RLS policies and updated_at trigger

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    grade_level TEXT,
    about TEXT,
    interests TEXT
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Users can view their own students"
    ON students FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
    ON students FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
    ON students FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students"
    ON students FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at for students
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete')),
    target_behavior TEXT,
    behavior_frequency TEXT,
    behavior_intensity TEXT,
    function_scores JSONB,
    determined_function TEXT,
    whats_been_tried TEXT,
    implementer TEXT,
    replacement_behavior TEXT,
    prevention_strategies TEXT,
    reinforcement_plan TEXT,
    response_to_behavior TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_student_id ON plans(student_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans table
CREATE POLICY "Users can view their own plans"
    ON plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
    ON plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
    ON plans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
    ON plans FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at for plans
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
