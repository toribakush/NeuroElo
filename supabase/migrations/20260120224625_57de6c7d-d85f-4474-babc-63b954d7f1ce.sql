-- Update the generate_connection_code function to use pgcrypto from extensions schema
CREATE OR REPLACE FUNCTION public.generate_connection_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate 22-character secure code with 128 bits of entropy
  NEW.connection_code := upper(
    substr(
      translate(
        encode(extensions.gen_random_bytes(16), 'base64'),
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
$function$;