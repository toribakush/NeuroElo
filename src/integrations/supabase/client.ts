import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO MANUAL (PARA GARANTIR QUE FUNCIONE) ---
const SUPABASE_URL = "https://ttyebetdyvkjlflfkomx.supabase.co";
const SUPABASE_KEY = "sb_publishable_w5kkqjMsIxdMoAa0kCovog_cXHZmAwo";

// Diagnóstico no Console (Só para termos certeza)
console.log("Conectando ao Supabase com a nova chave...");

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
