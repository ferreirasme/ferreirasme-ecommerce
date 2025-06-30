-- Create consultant_preferences table
CREATE TABLE IF NOT EXISTS consultant_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{
    "email_new_commission": true,
    "email_payment_approved": true,
    "email_new_client": true,
    "email_monthly_report": true,
    "email_marketing": false,
    "sms_new_commission": false,
    "sms_payment_approved": false,
    "push_notifications": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index
CREATE UNIQUE INDEX idx_consultant_preferences_consultant_id ON consultant_preferences(consultant_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_consultant_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultant_preferences_updated_at
BEFORE UPDATE ON consultant_preferences
FOR EACH ROW
EXECUTE FUNCTION update_consultant_preferences_updated_at();

-- Create RLS policies
ALTER TABLE consultant_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for consultants to manage their own preferences
CREATE POLICY "Consultants can view own preferences" ON consultant_preferences
  FOR SELECT USING (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Consultants can update own preferences" ON consultant_preferences
  FOR UPDATE USING (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Consultants can insert own preferences" ON consultant_preferences
  FOR INSERT WITH CHECK (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    )
  );

-- Policy for admins
CREATE POLICY "Admins can manage all preferences" ON consultant_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- Insert default preferences for existing consultants
INSERT INTO consultant_preferences (consultant_id)
SELECT id FROM consultants
WHERE id NOT IN (SELECT consultant_id FROM consultant_preferences)
ON CONFLICT DO NOTHING;