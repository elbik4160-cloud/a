-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT,
  phone TEXT,
  country_code2 TEXT,
  phone2 TEXT,
  request TEXT,
  notes TEXT,
  choose_sales TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client queue
CREATE TABLE IF NOT EXISTS client_queue (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  sales_user_id UUID NOT NULL,
  sales_email TEXT NOT NULL,
  sales_name TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client locks
CREATE TABLE IF NOT EXISTS client_locks (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  sales_user_id UUID NOT NULL,
  sales_email TEXT NOT NULL,
  sales_name TEXT NOT NULL,
  lock_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client blocks
CREATE TABLE IF NOT EXISTS client_blocks (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  sales_email TEXT NOT NULL,
  block_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_blocks ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "clients_select_own_admin" ON clients FOR SELECT TO authenticated USING (
  auth.uid()::text = created_by::text OR 
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "clients_insert_own" ON clients FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = created_by::text);
CREATE POLICY "clients_update_own_admin" ON clients FOR UPDATE TO authenticated USING (
  auth.uid()::text = created_by::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "clients_delete_admin" ON clients FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Client queue policies
CREATE POLICY "queue_select_all" ON client_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_insert_own" ON client_queue FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = sales_user_id::text);
CREATE POLICY "queue_update_own" ON client_queue FOR UPDATE TO authenticated USING (auth.uid()::text = sales_user_id::text);
CREATE POLICY "queue_delete_own" ON client_queue FOR DELETE TO authenticated USING (auth.uid()::text = sales_user_id::text);

-- Client locks policies
CREATE POLICY "locks_select_all" ON client_locks FOR SELECT TO authenticated USING (true);
CREATE POLICY "locks_insert_own" ON client_locks FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = sales_user_id::text);
CREATE POLICY "locks_delete_own" ON client_locks FOR DELETE TO authenticated USING (auth.uid()::text = sales_user_id::text);

-- Client blocks policies
CREATE POLICY "blocks_select_all" ON client_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocks_insert_own" ON client_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "blocks_delete_own" ON client_blocks FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON clients(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_locks_client_id ON client_locks(client_id);
