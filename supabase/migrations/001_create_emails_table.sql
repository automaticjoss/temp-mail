-- Create emails table for storing inbound emails
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    recipient TEXT NOT NULL,
    sender TEXT NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    raw_content TEXT,
    is_otp BOOLEAN DEFAULT false
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient);
CREATE INDEX IF NOT EXISTS idx_emails_is_otp ON emails(is_otp);

-- Enable Row Level Security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to SELECT (read) emails
CREATE POLICY "Allow public read access" ON emails
    FOR SELECT
    USING (true);

-- Policy: Only service_role can INSERT emails
CREATE POLICY "Only service role can insert" ON emails
    FOR INSERT
    WITH CHECK (
        (SELECT current_setting('role') = 'service_role')
    );

-- Policy: Only service_role can DELETE emails (for cleanup)
CREATE POLICY "Only service role can delete" ON emails
    FOR DELETE
    USING (
        (SELECT current_setting('role') = 'service_role')
    );

-- Enable Realtime for the emails table
ALTER PUBLICATION supabase_realtime ADD TABLE emails;

-- Comment for documentation
COMMENT ON TABLE emails IS 'Stores inbound emails received via Cloudflare Email Routing';
COMMENT ON COLUMN emails.is_otp IS 'True if email body contains a 6-digit OTP code';
