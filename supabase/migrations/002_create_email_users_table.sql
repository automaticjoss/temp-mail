-- Create email_users table for managing monitored email addresses
CREATE TABLE IF NOT EXISTS email_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    email TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'random'))
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_users_email ON email_users(email);
CREATE INDEX IF NOT EXISTS idx_email_users_created_at ON email_users(created_at DESC);

-- Enable Row Level Security
ALTER TABLE email_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to SELECT (read) users
CREATE POLICY "Allow public read access" ON email_users
    FOR SELECT
    USING (true);

-- Policy: Allow anyone to INSERT users (from the dashboard)
CREATE POLICY "Allow public insert" ON email_users
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anyone to DELETE users (from the dashboard)
CREATE POLICY "Allow public delete" ON email_users
    FOR DELETE
    USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE email_users;

COMMENT ON TABLE email_users IS 'Managed email addresses for receiving inbound emails';
