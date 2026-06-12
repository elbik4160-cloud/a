-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone2 TEXT,
  project TEXT,
  unit_type TEXT,
  budget TEXT,
  area TEXT,
  source TEXT NOT NULL DEFAULT 'Other',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  assigned_to_id UUID,
  assigned_to_name TEXT,
  assigned_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id UUID NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  outcome TEXT,
  next_action TEXT,
  follow_up_at TIMESTAMPTZ,
  duration_min INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead delays
CREATE TABLE IF NOT EXISTS lead_delays (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  reason_note TEXT,
  resume_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_delays ENABLE ROW LEVEL SECURITY;

-- Leads policies
CREATE POLICY "leads_select_own_admin" ON leads FOR SELECT TO authenticated USING (
  auth.uid()::text = assigned_to_id::text OR 
  auth.uid()::text = created_by_id::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "leads_insert_own" ON leads FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = created_by_id::text);
CREATE POLICY "leads_update_own_admin" ON leads FOR UPDATE TO authenticated USING (
  auth.uid()::text = assigned_to_id::text OR
  auth.uid()::text = created_by_id::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "leads_delete_admin" ON leads FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Lead activities policies
CREATE POLICY "activities_select_own_admin" ON lead_activities FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND (leads.assigned_to_id::text = auth.uid()::text OR leads.created_by_id::text = auth.uid()::text))
  OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "activities_insert_own" ON lead_activities FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND (leads.assigned_to_id::text = auth.uid()::text OR leads.created_by_id::text = auth.uid()::text))
);

-- Lead delays policies
CREATE POLICY "delays_select_own_admin" ON lead_delays FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_delays.lead_id AND (leads.assigned_to_id::text = auth.uid()::text OR leads.created_by_id::text = auth.uid()::text))
  OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "delays_insert_own" ON lead_delays FOR INSERT TO authenticated WITH CHECK (
  user_id::text = auth.uid()::text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON lead_activities(lead_id);
