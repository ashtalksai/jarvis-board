-- Migration: Jarvis Board Redesign
-- New columns and tables for the redesign

-- Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 2;
-- priority_level: 1=Low, 2=Medium, 3=High, 4=ASAP (🔥)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS eta DATE;
-- eta: Estimated completion date (when Jarvis will work on it)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW();
-- last_activity_at: When this task last had activity (for notifications)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
-- tags: Array of tag strings

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL, -- 'ash' or 'jarvis'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at);

-- Create task_last_seen table (for tracking unread notifications per user)
CREATE TABLE IF NOT EXISTS task_last_seen (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- 'ash' or 'jarvis'
  last_seen_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_last_seen_user ON task_last_seen(user_id);

-- Update existing priority values to numeric
UPDATE tasks SET priority_level = 
  CASE priority
    WHEN 'Low' THEN 1
    WHEN 'Medium' THEN 2
    WHEN 'High' THEN 3
    WHEN 'Urgent' THEN 4
    ELSE 2
  END
WHERE priority_level IS NULL OR priority_level = 2;
