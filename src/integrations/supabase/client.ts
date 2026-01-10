import { createClient } from '@supabase/supabase-js';

// Chaves extraídas diretamente do seu painel aberto
const supabaseUrl = 'https://xqwxwnvwjnxbqrnshpkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxd3h3bnZ3am54YnFybnNocGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTgyODQsImV4cCI6MjA4MTg3NDI4NH0.FgdvaZ0TpNef4bZ7wKRLgqZmNxx4Z0jf6zyFH6CGjaI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
