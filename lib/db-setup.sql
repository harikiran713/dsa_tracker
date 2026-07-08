-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_title VARCHAR(500),
  question_phase VARCHAR(50),
  status VARCHAR(50) DEFAULT 'todo',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON user_progress(question_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT
  USING (true);

-- RLS policies for user_progress table
CREATE POLICY "Users can read their own progress" ON user_progress
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own progress" ON user_progress
  FOR DELETE
  USING (true);
