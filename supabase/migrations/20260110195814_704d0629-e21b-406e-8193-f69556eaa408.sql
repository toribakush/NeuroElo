-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('professional', 'family');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  connection_code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create patient_connections table for professional-patient relationships
CREATE TABLE public.patient_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  connection_code text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(professional_id, patient_id)
);

ALTER TABLE public.patient_connections ENABLE ROW LEVEL SECURITY;

-- Create daily_logs table
CREATE TABLE public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood text,
  intensity integer,
  triggers text[],
  location text,
  notes text,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Create medications table
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dosage text,
  time text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check professional access to patient
CREATE OR REPLACE FUNCTION public.professional_has_patient_access(_professional_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_connections
    WHERE professional_id = _professional_id
      AND patient_id = _patient_id
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role on signup" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Professionals can view connected patients" ON public.profiles
  FOR SELECT USING (
    public.professional_has_patient_access(auth.uid(), id)
  );

-- RLS Policies for patient_connections
CREATE POLICY "Users can view own connections" ON public.patient_connections
  FOR SELECT USING (auth.uid() = professional_id OR auth.uid() = patient_id);

CREATE POLICY "Professionals can create connections" ON public.patient_connections
  FOR INSERT WITH CHECK (
    auth.uid() = professional_id AND public.has_role(auth.uid(), 'professional')
  );

CREATE POLICY "Users can delete own connections" ON public.patient_connections
  FOR DELETE USING (auth.uid() = professional_id OR auth.uid() = patient_id);

-- RLS Policies for daily_logs
CREATE POLICY "Users can view own logs" ON public.daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.daily_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view connected patient logs" ON public.daily_logs
  FOR SELECT USING (
    public.professional_has_patient_access(auth.uid(), user_id)
  );

-- RLS Policies for medications
CREATE POLICY "Users can view own medications" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view connected patient medications" ON public.medications
  FOR SELECT USING (
    public.professional_has_patient_access(auth.uid(), user_id)
  );

CREATE POLICY "Professionals can manage connected patient medications" ON public.medications
  FOR INSERT WITH CHECK (
    public.professional_has_patient_access(auth.uid(), user_id)
  );

CREATE POLICY "Professionals can update connected patient medications" ON public.medications
  FOR UPDATE USING (
    public.professional_has_patient_access(auth.uid(), user_id)
  );

CREATE POLICY "Professionals can delete connected patient medications" ON public.medications
  FOR DELETE USING (
    public.professional_has_patient_access(auth.uid(), user_id)
  );

-- Function to generate unique connection code
CREATE OR REPLACE FUNCTION public.generate_connection_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.connection_code := upper(substr(md5(random()::text), 1, 8));
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate connection code for new profiles
CREATE TRIGGER generate_profile_connection_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.connection_code IS NULL)
  EXECUTE FUNCTION public.generate_connection_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to 'family'
  user_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'family'
  );
  
  -- Create profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();