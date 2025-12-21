import { createClient } from '@supabase/supabase-js';

// --- CONEXÃO COM A CHAVE PADRÃO (DEFAULT) ---
const SUPABASE_URL = "https://ttyebetdyvkjlflfkomx.supabase.co";

// Usando a chave 'Default' que aparece no seu painel (VGskK...)
// Ela é mais segura de funcionar que chaves geradas manualmente
const SUPABASE_KEY = "sb_publishable_VGskK9gdVs3mZPxehL4hpA_wUJLornj";

console.log("--- TENTATIVA FINAL ---");
console.log("Usando chave Default:", SUPABASE_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
