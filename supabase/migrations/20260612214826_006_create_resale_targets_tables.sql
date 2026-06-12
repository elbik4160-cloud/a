-- Resale listings
CREATE TABLE IF NOT EXISTS resale_listings (
  id SERIAL PRIMARY KEY,
  project_name TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  floor INTEGER,
  area TEXT,
  price TEXT,
  finishing TEXT,
  description TEXT,
  images TEXT,
  owner_name_enc TEXT NOT NULL,
  owner_phone_enc TEXT NOT NULL,
  owner_id_enc TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  uploaded_by_id UUID NOT NULL,
  uploaded_by_name TEXT,
  assigned_to_id UUID,
  assigned_to_name TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales targets
CREATE TABLE IF NOT EXISTS sales_targets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  period_month TEXT NOT NULL,
  calls_target INTEGER NOT NULL DEFAULT 0,
  whatsapp_target INTEGER NOT NULL DEFAULT 0,
  meetings_target INTEGER NOT NULL DEFAULT 0,
  deals_target INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period_month)
);

-- Enable RLS
ALTER TABLE resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Resale listings policies
CREATE POLICY "resale_select_all" ON resale_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "resale_insert_own" ON resale_listings FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = uploaded_by_id::text);
CREATE POLICY "resale_update_own_admin" ON resale_listings FOR UPDATE TO authenticated USING (
  auth.uid()::text = uploaded_by_id::text OR
  auth.uid()::text = assigned_to_id::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "resale_delete_admin" ON resale_listings FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Sales targets policies
CREATE POLICY "targets_select_own_admin" ON sales_targets FOR SELECT TO authenticated USING (
  auth.uid()::text = user_id::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "targets_insert_own" ON sales_targets FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "targets_update_own_admin" ON sales_targets FOR UPDATE TO authenticated USING (
  auth.uid()::text = user_id::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "targets_delete_admin" ON sales_targets FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resale_status ON resale_listings(status);
CREATE INDEX IF NOT EXISTS idx_resale_uploaded_by ON resale_listings(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_targets_user ON sales_targets(user_id);
