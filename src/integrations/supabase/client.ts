import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO CORRIGIDA (AGORA VAI!) ---

// 1. URL DO SEU PROJETO ATUAL (Baseada no ID que você mandou)
const SUPABASE_URL = "https://xqwxwnvwjnxbqrnshpkw.supabase.co";

// 2. CHAVE PADRÃO DO PROJETO (Aquela que começa com VGskK...)
const SUPABASE_KEY = "sb_publishable_VGskK9gdVs3mZPxehL4hpA_wUJLornj";

console.log("--- CONEXÃO ALINHADA ---");
console.log("URL:", SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
