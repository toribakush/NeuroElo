-- Create trigger for INSERT to auto-generate connection code on new profiles
DROP TRIGGER IF EXISTS generate_connection_code_on_insert ON public.profiles;
CREATE TRIGGER generate_connection_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_connection_code();

-- Also update the existing trigger to only fire on UPDATE when connection_code is null
DROP TRIGGER IF EXISTS generate_connection_code_on_update ON public.profiles;
CREATE TRIGGER generate_connection_code_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.connection_code IS NULL OR OLD.connection_code IS NULL)
  EXECUTE FUNCTION public.generate_connection_code();