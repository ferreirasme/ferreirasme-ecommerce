-- Enable RLS on consultants table if not already enabled
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can create consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can update consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can delete consultants" ON consultants;
DROP POLICY IF EXISTS "Consultants can view own record" ON consultants;
DROP POLICY IF EXISTS "Consultants can update own record" ON consultants;

-- Admin policies
-- Note: admins table uses email to match with auth.jwt() ->> 'email'
CREATE POLICY "Admins can view all consultants" ON consultants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    )
  );

CREATE POLICY "Admins can create consultants" ON consultants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    )
  );

CREATE POLICY "Admins can update consultants" ON consultants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    )
  );

CREATE POLICY "Admins can delete consultants" ON consultants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    )
  );

-- Consultant policies
CREATE POLICY "Consultants can view own record" ON consultants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Consultants can update own record" ON consultants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also add RLS to other related tables if needed
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_commissions ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Consultants can view own clients" ON clients;

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    )
  );

CREATE POLICY "Consultants can view own clients" ON clients
  FOR SELECT
  TO authenticated
  USING (consultant_id IN (
    SELECT id FROM consultants WHERE user_id = auth.uid()
  ));

-- Policies for consultant_commissions table
DROP POLICY IF EXISTS "Admins can manage all commissions" ON consultant_commissions;
DROP POLICY IF EXISTS "Consultants can view own commissions" ON consultant_commissions;

CREATE POLICY "Admins can manage all commissions" ON consultant_commissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    )
  );

CREATE POLICY "Consultants can view own commissions" ON consultant_commissions
  FOR SELECT
  TO authenticated
  USING (consultant_id IN (
    SELECT id FROM consultants WHERE user_id = auth.uid()
  ));

-- Create a simple debug policy temporarily to test
CREATE POLICY "Temporary - All authenticated users can view consultants" ON consultants
  FOR SELECT
  TO authenticated
  USING (true);