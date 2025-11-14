/*
  # Create 3D Spatial CAPTCHA SaaS Database Schema

  ## 1. New Tables
    
    ### users_profile
    - `id` (uuid, primary key) - Links to auth.users
    - `email` (text) - User email
    - `company_name` (text, nullable) - Organization name
    - `plan_type` (text) - free, pro, enterprise
    - `api_calls_limit` (integer) - Monthly API call limit
    - `api_calls_used` (integer) - Current month usage
    - `created_at` (timestamptz) - Account creation date
    - `updated_at` (timestamptz) - Last update
    
    ### api_keys
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key) - Owner of the key
    - `key_hash` (text) - Hashed API key
    - `key_prefix` (text) - First 8 chars for display
    - `name` (text) - User-friendly name
    - `is_active` (boolean) - Enable/disable key
    - `last_used_at` (timestamptz, nullable) - Last usage time
    - `created_at` (timestamptz) - Creation date
    
    ### captcha_sessions
    - `id` (uuid, primary key)
    - `api_key_id` (uuid, foreign key) - Which API key was used
    - `session_token` (text, unique) - Unique session identifier
    - `target_rotation_x` (real) - Target X rotation in radians
    - `target_rotation_y` (real) - Target Y rotation in radians
    - `target_rotation_z` (real) - Target Z rotation in radians
    - `client_ip` (text, nullable) - Client IP address
    - `user_agent` (text, nullable) - Client user agent
    - `is_verified` (boolean) - Verification status
    - `attempts` (integer) - Number of verification attempts
    - `error_degrees` (real, nullable) - Final error in degrees
    - `created_at` (timestamptz) - Session creation
    - `verified_at` (timestamptz, nullable) - When verified
    - `expires_at` (timestamptz) - Session expiration
    
    ### verification_analytics
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key) - API key owner
    - `date` (date) - Analytics date
    - `total_sessions` (integer) - Total CAPTCHA sessions created
    - `successful_verifications` (integer) - Successful completions
    - `failed_verifications` (integer) - Failed attempts
    - `avg_error_degrees` (real) - Average error in degrees
    - `avg_attempts` (real) - Average attempts per session
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## 2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - API keys are hashed for security
    - Session tokens are unique and expire after 10 minutes
    
  ## 3. Indexes
    - Index on api_keys.key_hash for fast lookups
    - Index on captcha_sessions.session_token for verification
    - Index on verification_analytics (user_id, date) for dashboard queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Profile Table
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  company_name text,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  api_calls_limit integer NOT NULL DEFAULT 1000,
  api_calls_used integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- CAPTCHA Sessions Table
CREATE TABLE IF NOT EXISTS captcha_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  target_rotation_x real NOT NULL,
  target_rotation_y real NOT NULL,
  target_rotation_z real NOT NULL,
  client_ip text,
  user_agent text,
  is_verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  error_degrees real,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE captcha_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON captcha_sessions FOR SELECT
  TO authenticated
  USING (
    api_key_id IN (
      SELECT id FROM api_keys WHERE user_id = auth.uid()
    )
  );

-- Public access for verification (via edge function)
CREATE POLICY "Public can insert sessions"
  ON captcha_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update sessions for verification"
  ON captcha_sessions FOR UPDATE
  TO anon, authenticated
  USING (expires_at > now() AND attempts < 10)
  WITH CHECK (expires_at > now() AND attempts < 10);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_token ON captcha_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_api_key ON captcha_sessions(api_key_id);

-- Verification Analytics Table
CREATE TABLE IF NOT EXISTS verification_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_sessions integer DEFAULT 0,
  successful_verifications integer DEFAULT 0,
  failed_verifications integer DEFAULT 0,
  avg_error_degrees real DEFAULT 0,
  avg_attempts real DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE verification_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analytics"
  ON verification_analytics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON verification_analytics(user_id, date DESC);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, plan_type, api_calls_limit, api_calls_used)
  VALUES (new.id, new.email, 'free', 1000, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update analytics (called by edge function)
CREATE OR REPLACE FUNCTION public.update_verification_analytics(
  p_user_id uuid,
  p_success boolean,
  p_error_degrees real,
  p_attempts integer
)
RETURNS void AS $$
BEGIN
  INSERT INTO verification_analytics (
    user_id,
    date,
    total_sessions,
    successful_verifications,
    failed_verifications,
    avg_error_degrees,
    avg_attempts
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_error_degrees,
    p_attempts
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_sessions = verification_analytics.total_sessions + 1,
    successful_verifications = verification_analytics.successful_verifications + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_verifications = verification_analytics.failed_verifications + 
      CASE WHEN p_success THEN 0 ELSE 1 END,
    avg_error_degrees = (verification_analytics.avg_error_degrees * verification_analytics.total_sessions + p_error_degrees) / 
      (verification_analytics.total_sessions + 1),
    avg_attempts = (verification_analytics.avg_attempts * verification_analytics.total_sessions + p_attempts) / 
      (verification_analytics.total_sessions + 1),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;