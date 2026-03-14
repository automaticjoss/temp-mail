-- ============================================
-- TMailDash - Full Database Setup
-- ============================================
-- Copy ALL of this SQL and paste into:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================

-- 1. EMAILS TABLE
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

CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient);
CREATE INDEX IF NOT EXISTS idx_emails_is_otp ON emails(is_otp);

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='emails' AND policyname='Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON emails FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='emails' AND policyname='Only service role can insert') THEN
    CREATE POLICY "Only service role can insert" ON emails FOR INSERT WITH CHECK ((SELECT current_setting('role') = 'service_role'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='emails' AND policyname='Only service role can delete') THEN
    CREATE POLICY "Only service role can delete" ON emails FOR DELETE USING ((SELECT current_setting('role') = 'service_role'));
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE emails;

-- 2. EMAIL USERS TABLE
CREATE TABLE IF NOT EXISTS email_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    email TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'random'))
);

CREATE INDEX IF NOT EXISTS idx_email_users_email ON email_users(email);
CREATE INDEX IF NOT EXISTS idx_email_users_created_at ON email_users(created_at DESC);

ALTER TABLE email_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_users' AND policyname='Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON email_users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_users' AND policyname='Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON email_users FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_users' AND policyname='Allow public delete') THEN
    CREATE POLICY "Allow public delete" ON email_users FOR DELETE USING (true);
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE email_users;

-- 3. ADMIN CONFIG TABLE
CREATE TABLE IF NOT EXISTS admin_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_config' AND policyname='No public select') THEN
    CREATE POLICY "No public select" ON admin_config FOR SELECT USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_config' AND policyname='No public insert') THEN
    CREATE POLICY "No public insert" ON admin_config FOR INSERT WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_config' AND policyname='No public update') THEN
    CREATE POLICY "No public update" ON admin_config FOR UPDATE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_config' AND policyname='No public delete') THEN
    CREATE POLICY "No public delete" ON admin_config FOR DELETE USING (false);
  END IF;
END $$;

INSERT INTO admin_config (key, value) VALUES
  ('admin_username', 'admin'),
  ('admin_password', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
  ('domains', '["@domain.com","@mail.test"]')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DONE! All tables created successfully.
-- ============================================
