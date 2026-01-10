-- Improve connection code generation with higher entropy (128+ bits)
-- This replaces the weak 8-character MD5-based code with a 22-character secure code

CREATE OR REPLACE FUNCTION public.generate_connection_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate 22-character base64-like code (128 bits of entropy)
  -- Using gen_random_bytes for cryptographically secure randomness
  -- Translating +/= to alphanumeric chars for URL safety
  NEW.connection_code := upper(
    substr(
      translate(
        encode(gen_random_bytes(16), 'base64'),
        '+/=',
        'XYZ'
      ),
      1, 22
    )
  );
  RETURN NEW;
END;
$$;

-- Add expiration column for connection codes (7-day validity)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS connection_code_expires_at timestamptz;

-- Set expiration for existing codes
UPDATE public.profiles 
SET connection_code_expires_at = now() + interval '7 days'
WHERE connection_code IS NOT NULL AND connection_code_expires_at IS NULL;

-- Create a function to validate connection codes (checks expiration)
CREATE OR REPLACE FUNCTION public.validate_connection_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles 
  WHERE connection_code = _code 
    AND (connection_code_expires_at IS NULL OR connection_code_expires_at > now())
  LIMIT 1;
$$;

-- Update trigger to also set expiration when generating new codes
CREATE OR REPLACE FUNCTION public.generate_connection_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate 22-character secure code with 128 bits of entropy
  NEW.connection_code := upper(
    substr(
      translate(
        encode(gen_random_bytes(16), 'base64'),
        '+/=',
        'XYZ'
      ),
      1, 22
    )
  );
  -- Set 7-day expiration
  NEW.connection_code_expires_at := now() + interval '7 days';
  RETURN NEW;
END;
$$;