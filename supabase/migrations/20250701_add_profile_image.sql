-- Add profile image fields to consultants table
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS odoo_image_1920 TEXT;

-- Add comments
COMMENT ON COLUMN consultants.profile_image_url IS 'URL da imagem de perfil armazenada no Supabase Storage';
COMMENT ON COLUMN consultants.odoo_image_1920 IS 'Imagem em base64 importada da Odoo';

-- Create storage bucket for consultant profiles if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultant-profiles', 'consultant-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Admins can upload consultant profiles" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'consultant-profiles' AND
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.active = true
  )
);

CREATE POLICY "Admins can update consultant profiles" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'consultant-profiles' AND
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.active = true
  )
);

CREATE POLICY "Anyone can view consultant profiles" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'consultant-profiles');

CREATE POLICY "Admins can delete consultant profiles" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'consultant-profiles' AND
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.active = true
  )
);