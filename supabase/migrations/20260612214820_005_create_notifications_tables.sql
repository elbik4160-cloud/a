-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  body TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  type TEXT NOT NULL,
  ref_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  from_user_name TEXT NOT NULL,
  to_user_id UUID NOT NULL,
  text TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  permission_key TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, permission_key)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "notifications_insert_admin" ON notifications FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Comments policies
CREATE POLICY "comments_select_own" ON comments FOR SELECT TO authenticated USING (
  auth.uid()::text = from_user_id::text OR 
  auth.uid()::text = to_user_id::text OR
  EXISTS (SELECT 1 FROM leads WHERE leads.id = comments.lead_id AND (leads.assigned_to_id::text = auth.uid()::text OR leads.created_by_id::text = auth.uid()::text))
  OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = from_user_id::text);

-- User permissions policies
CREATE POLICY "perms_select_all" ON user_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "perms_admin" ON user_permissions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Audit logs policies
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "audit_insert_admin" ON audit_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_lead ON comments(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
