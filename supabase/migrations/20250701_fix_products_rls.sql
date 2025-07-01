-- Fix products RLS policies - correct table name from admin_users to admins

-- Drop existing incorrect policy
DROP POLICY IF EXISTS "Admin users can manage products" ON products;

-- Create correct policy using the actual admins table
CREATE POLICY "Admins can manage products" ON products
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- Also ensure public can read active products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

CREATE POLICY "Products are viewable by everyone" ON products
FOR SELECT TO anon, authenticated
USING (active = true);

-- Service role can do everything (bypasses RLS)
-- This is automatic in Supabase when using service role key