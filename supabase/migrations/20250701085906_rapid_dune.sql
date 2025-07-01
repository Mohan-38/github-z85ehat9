/*
  # Create Email OTP System
  
  1. New Tables
    - `email_otps`
      - `id` (uuid, primary key)
      - `email` (text)
      - `otp_code` (text)
      - `type` (text) - email_change, password_reset, signup_verification
      - `user_id` (uuid, optional reference to auth.users)
      - `expires_at` (timestamptz)
      - `is_used` (boolean)
      - `verified_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on email_otps table
    - Add policies for OTP management
    - Add indexes for performance
  
  3. Functions
    - Cleanup expired OTPs
    - Rate limiting for OTP requests
*/

-- Create email_otps table
CREATE TABLE IF NOT EXISTS email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  type text NOT NULL CHECK (type IN ('email_change', 'password_reset', 'signup_verification')),
  user_id uuid, -- Optional reference to auth.users
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_code ON email_otps(otp_code);
CREATE INDEX IF NOT EXISTS idx_email_otps_type ON email_otps(type);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_used ON email_otps(is_used);
CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON email_otps(user_id);

-- Enable RLS
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Policies for email_otps
CREATE POLICY "Service role can manage all OTPs"
  ON email_otps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own OTPs"
  ON email_otps
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.email());

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM email_otps 
  WHERE expires_at < now() - interval '1 hour'; -- Keep expired OTPs for 1 hour for audit
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to check rate limiting (max 5 OTPs per email per hour)
CREATE OR REPLACE FUNCTION check_otp_rate_limit(email_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM email_otps
  WHERE email = email_param
    AND created_at > now() - interval '1 hour';
  
  RETURN recent_count < 5;
END;
$$;

-- Function to get latest valid OTP for email and type
CREATE OR REPLACE FUNCTION get_valid_otp(
  email_param text,
  type_param text
)
RETURNS TABLE (
  id uuid,
  otp_code text,
  expires_at timestamptz,
  is_used boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.otp_code,
    o.expires_at,
    o.is_used
  FROM email_otps o
  WHERE o.email = email_param
    AND o.type = type_param
    AND o.expires_at > now()
    AND o.is_used = false
  ORDER BY o.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO service_role;
GRANT EXECUTE ON FUNCTION check_otp_rate_limit(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_valid_otp(text, text) TO service_role;