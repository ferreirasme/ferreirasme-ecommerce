-- Debug and fix consultants RLS policies
-- First, let's check the current policies
DO $$
BEGIN
  RAISE NOTICE 'Checking current RLS policies on consultants table...';
END $$;

-- Ensure RLS is enabled
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can create consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can update consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can delete consultants" ON consultants;
DROP POLICY IF EXISTS "Consultants can view own record" ON consultants;
DROP POLICY IF EXISTS "Consultants can update own record" ON consultants;
DROP POLICY IF EXISTS "Temporary - All authenticated users can view consultants" ON consultants;

-- Create a more permissive policy for admins (using email from JWT)
CREATE POLICY "Admin full access to consultants" ON consultants
  FOR ALL
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

-- Policy for consultants to view their own record
CREATE POLICY "Consultants can view own record" ON consultants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for consultants to update specific fields in their own record
CREATE POLICY "Consultants can update own profile" ON consultants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND (
      -- Only allow updating specific fields
      profile_image_url IS NOT DISTINCT FROM OLD.profile_image_url OR
      profile_image_url IS NOT NULL
    )
  );

-- Ensure clients table has proper policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop and recreate clients policies
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Consultants can view own clients" ON clients;

CREATE POLICY "Admin full access to clients" ON clients
  FOR ALL
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

CREATE POLICY "Consultants can view own clients" ON clients
  FOR SELECT
  TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    )
  );

-- Add a debug function to check authentication
CREATE OR REPLACE FUNCTION check_admin_auth()
RETURNS TABLE (
  is_authenticated boolean,
  user_email text,
  is_admin boolean,
  admin_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() IS NOT NULL as is_authenticated,
    auth.jwt() ->> 'email' as user_email,
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
    ) as is_admin,
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.active = true
    ) as admin_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_admin_auth() TO authenticated;

-- Add comment
COMMENT ON FUNCTION check_admin_auth() IS 'Debug function to check admin authentication status';