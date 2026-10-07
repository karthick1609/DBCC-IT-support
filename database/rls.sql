-- Row Level Security policies (examples)

-- Enable RLS on tickets
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets FORCE ROW LEVEL SECURITY;

-- Staff: can select their own tickets
CREATE POLICY staff_select_own ON tickets
  FOR SELECT USING ( requester_id = current_setting('app.current_user_id')::uuid );

-- Staff: can insert tickets
CREATE POLICY staff_insert ON tickets
  FOR INSERT WITH CHECK ( true );

-- Admin: full access (assumes server side uses service role)
CREATE POLICY admin_full_access ON tickets
  FOR ALL USING ( current_setting('app.current_user_role') = 'admin' ) WITH CHECK ( current_setting('app.current_user_role') = 'admin' );

-- RLS for assets: staff can view assets but admin full
ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY assets_admin_full ON assets FOR ALL USING ( current_setting('app.current_user_role') = 'admin' ) WITH CHECK ( current_setting('app.current_user_role') = 'admin' );
CREATE POLICY assets_public_select ON assets FOR SELECT USING ( true );
