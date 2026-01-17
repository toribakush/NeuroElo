-- Create appointments table for scheduling
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own appointments
CREATE POLICY "Professionals can view own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = professional_id);

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = patient_id);

-- Professionals can create appointments for connected patients
CREATE POLICY "Professionals can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  auth.uid() = professional_id 
  AND has_role(auth.uid(), 'professional'::app_role)
  AND professional_has_patient_access(auth.uid(), patient_id)
);

-- Professionals can update their own appointments
CREATE POLICY "Professionals can update own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id);

-- Professionals can delete their own appointments
CREATE POLICY "Professionals can delete own appointments" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();