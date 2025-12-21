import { createClient } from '@supabase/supabase-js';

// --- CONEXÃO MANUAL (IGNORANDO O LOVABLE) ---
const SUPABASE_URL = "https://ttyebetdyvkjlflfkomx.supabase.co";

// Usando a chave mais recente que você mandou (começa com w5kkq...)
const SUPABASE_KEY = "sb_publishable_w5kkqjMsIxdMoAa0kCovog_cXHZmAwo";

console.log("--- CONEXÃO FORÇADA ---");
console.log("URL:", SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
