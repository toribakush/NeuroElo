import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { Session } from '@supabase/supabase-js';

// Define o formato do Usuário para o resto do app
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  connectionCode?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  // Mantemos essas funções vazias ou como wrappers apenas para não quebrar outros arquivos que as chamem
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função auxiliar para transformar o usuário do Supabase no formato do seu App
  const mapSupabaseUser = (session: Session | null): AuthUser | null => {
    if (!session?.user) return null;

    const metadata = session.user.user_metadata || {};

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: metadata.full_name || 'Usuário', // Pega o nome salvo no cadastro
      role: (metadata.role as UserRole) || 'family', // Pega a role salva no cadastro
      connectionCode: metadata.connection_code
    };
  };

  useEffect(() => {
    // 1. Verifica sessão inicial
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(mapSupabaseUser(session));
      } catch (error) {
        console.error("Erro ao iniciar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // 2. Escuta mudanças em tempo real (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Mudança de Auth detectada:", _event); // Debug
      setUser(mapSupabaseUser(session));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Funções de ação (Wrappers para o Supabase)
  
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Limpa o localStorage para garantir
    localStorage.clear(); 
  };

  // Essas funções abaixo agora chamam o Supabase direto, 
  // caso algum outro componente tente usar o contexto para logar.
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    // O cadastro real é complexo e já está feito no Auth.tsx, 
    // mas deixamos aqui como fallback.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: role }
      }
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signOut,
      signIn,
      signUp 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
