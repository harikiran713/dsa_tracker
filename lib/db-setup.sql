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

-- Completion events for analytics and leaderboard
CREATE TABLE IF NOT EXISTS completion_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_title VARCHAR(500),
  question_phase VARCHAR(50),
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_completion_events_user_id ON completion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_completion_events_completed_at ON completion_events(completed_at);

ALTER TABLE completion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read completion events" ON completion_events
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert completion events" ON completion_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can upsert completion events" ON completion_events
  FOR UPDATE USING (true) WITH CHECK (true);

-- Daily todos synced for leaderboard
CREATE TABLE IF NOT EXISTS daily_todos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  question_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_todos_user_id ON daily_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_todos_date ON daily_todos(date);

ALTER TABLE daily_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily todos" ON daily_todos
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage daily todos" ON daily_todos
  FOR ALL USING (true) WITH CHECK (true);
