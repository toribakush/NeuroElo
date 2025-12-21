import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- BLOCO DE DIAGNÓSTICO (DEDO-DURO) ---
console.log("--- TESTE DE CONEXÃO SUPABASE ---");
console.log("URL encontrada?", SUPABASE_URL ? "SIM" : "NÃO (ERRO CRÍTICO)");
console.log("KEY encontrada?", SUPABASE_KEY ? "SIM" : "NÃO (ERRO CRÍTICO)");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERRO FATAL: As variáveis de ambiente do Supabase não foram carregadas.");
  console.error("Verifique se você criou o arquivo .env na raiz do projeto ou configurou os segredos no Lovable/Vercel.");
}
// ----------------------------------------

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');
