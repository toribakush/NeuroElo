import { createClient } from '@supabase/supabase-js';

// Estamos colocando as chaves direto aqui para garantir que funcionem
const SUPABASE_URL = "https://ttyebetdyvkjlflfkomx.supabase.co";
const SUPABASE_KEY = "sb_publishable_VGskK9gdVs3mZPxehL4hpA_wUJLornj";

// Cria a conexão
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
