-- Migration: Add calendar fields to tasks table
-- Created: 2025-02-07

ALTER TABLE tasks ADD COLUMN due_date TEXT;
ALTER TABLE tasks ADD COLUMN estimated_hours REAL;
ALTER TABLE tasks ADD COLUMN actual_hours REAL;

-- Create index for calendar queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
