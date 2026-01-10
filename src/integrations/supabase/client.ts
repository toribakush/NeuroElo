import { createClient } from '@supabase/supabase-js';

// Forçamos as chaves aqui para ignorar o erro de "Invalid API Key" do Lovable
const supabaseUrl = 'https://xqwxwnvwjnxbqrnshpkw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxd3h3bnZ3am54YnFybnNocGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTgyODQsImV4cCI6MjA4MTg3NDI4NH0.FgdvaZ0TpNef4bZ7wKRLgqZmNxx4Z0jf6zyFH6CGjaI';

// O cliente é criado ignorando qualquer variável global do Lovable
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
