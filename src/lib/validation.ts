import { z } from 'zod';

// Daily Log validation schema
export const dailyLogSchema = z.object({
  mood: z.enum(['bom_dia', 'ansiedade', 'meltdown', 'crise'], {
    required_error: 'Selecione o estado',
    invalid_type_error: 'Estado inválido',
  }),
  intensity: z.number().int().min(1, 'Intensidade mínima é 1').max(10, 'Intensidade máxima é 10'),
  triggers: z.array(z.string().max(50)).max(10, 'Máximo de 10 gatilhos'),
  location: z.string().max(200, 'Local deve ter no máximo 200 caracteres').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional().or(z.literal('')),
});

// Medication validation schema
export const medicationSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  dosage: z.string().max(50, 'Dose deve ter no máximo 50 caracteres').optional().or(z.literal('')),
  time: z.string().max(50, 'Horário deve ter no máximo 50 caracteres').optional().or(z.literal('')),
});

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email deve ter no máximo 255 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres'),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  role: z.enum(['family', 'professional'], {
    required_error: 'Selecione o tipo de conta',
  }),
});

// Helper function to get safe error message
export const getSafeErrorMessage = (error: unknown): string => {
  // Only show detailed messages in development
  if (import.meta.env.DEV && error instanceof Error) {
    return error.message;
  }
  
  // Production: Return generic messages based on known error patterns
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Invalid login') || errorMessage.includes('invalid_credentials')) {
    return 'Email ou senha incorretos.';
  }
  if (errorMessage.includes('email_not_confirmed') || errorMessage.includes('Email not confirmed')) {
    return 'Por favor, confirme seu email antes de entrar.';
  }
  if (errorMessage.includes('User already registered')) {
    return 'Este email já está cadastrado.';
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }
  
  return 'Ocorreu um erro. Tente novamente.';
};
