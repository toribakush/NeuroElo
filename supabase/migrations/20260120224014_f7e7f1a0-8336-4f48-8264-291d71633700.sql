-- Fix signup failing with: function gen_random_bytes(integer) does not exist
-- gen_random_bytes is provided by the pgcrypto extension.

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Optional safety: ensure search_path is not required for calls
-- (functions can call extensions.gen_random_bytes explicitly if needed)