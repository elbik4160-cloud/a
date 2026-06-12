-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  sales_user_id UUID NOT NULL,
  sales_name TEXT NOT NULL,
  sales_email TEXT NOT NULL,
  client_data TEXT,
  client_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  message_text TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat permissions
CREATE TABLE IF NOT EXISTS chat_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_permissions ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "feedback_select_own_admin" ON feedback FOR SELECT TO authenticated USING (
  auth.uid()::text = sales_user_id::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "feedback_insert_own" ON feedback FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = sales_user_id::text);

-- Chat messages policies
CREATE POLICY "chat_select_all" ON chat_messages FOR SELECT TO authenticated USING (is_deleted = FALSE OR auth.uid()::text = user_id::text);
CREATE POLICY "chat_insert_own" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "chat_update_admin" ON chat_messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Chat permissions policies
CREATE POLICY "chat_perms_select_all" ON chat_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "chat_perms_update_admin" ON chat_permissions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "chat_perms_insert_own" ON chat_permissions FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);
