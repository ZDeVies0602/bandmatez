-- Create practice_sessions table for tracking user practice sessions
CREATE TABLE IF NOT EXISTS practice_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_session_date ON practice_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_is_active ON practice_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_active ON practice_sessions(user_id, is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
DROP TRIGGER IF EXISTS update_practice_sessions_updated_at ON practice_sessions;
CREATE TRIGGER update_practice_sessions_updated_at
    BEFORE UPDATE ON practice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own practice sessions
CREATE POLICY "Users can view their own practice sessions" ON practice_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own practice sessions
CREATE POLICY "Users can insert their own practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own practice sessions
CREATE POLICY "Users can update their own practice sessions" ON practice_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own practice sessions
CREATE POLICY "Users can delete their own practice sessions" ON practice_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Add constraint to ensure only one active session per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_practice_sessions_unique_active_user 
ON practice_sessions(user_id) 
WHERE is_active = true; 