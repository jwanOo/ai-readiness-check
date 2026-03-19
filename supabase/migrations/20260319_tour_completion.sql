-- Migration: Add tour completion tracking to profiles
-- Date: 2026-03-19
-- Description: Adds has_completed_tour column to track if user has seen the onboarding tour

-- Add has_completed_tour column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT FALSE;

-- Add tour_completed_at timestamp for analytics
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMPTZ;

-- Create index for quick lookup of users who haven't completed tour
CREATE INDEX IF NOT EXISTS idx_profiles_tour_incomplete 
ON profiles (has_completed_tour) 
WHERE has_completed_tour = FALSE;

-- Comment on columns
COMMENT ON COLUMN profiles.has_completed_tour IS 'Whether the user has completed the onboarding tour';
COMMENT ON COLUMN profiles.tour_completed_at IS 'Timestamp when the user completed the onboarding tour';