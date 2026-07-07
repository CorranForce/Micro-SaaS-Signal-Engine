-- Create the secret_keys table
CREATE TABLE IF NOT EXISTS public.secret_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.secret_keys ENABLE ROW LEVEL SECURITY;

-- Allow read access only for authenticated users (or define proper roles)
-- If this table is only accessed server-side using the service role key,
-- no RLS policies are needed for the anon key, keeping it fully protected.
CREATE POLICY "Deny all access to secret keys by default" 
  ON public.secret_keys 
  FOR ALL 
  TO public 
  USING (false);

-- (Optional) If you have a specific role or function that needs access:
-- CREATE POLICY "Allow service role full access" ON public.secret_keys FOR ALL TO service_role USING (true);
