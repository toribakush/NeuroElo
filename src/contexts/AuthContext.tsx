import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { Session } from '@supabase/supabase-js';

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

  // Função blindada para mapear o usuário e perfil
  const mapUser = (session: Session | null, profile?: any): AuthUser | null => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.full_name || session.user.user_metadata?.full_name || 'Usuário',
      role: (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || 'family',
      connectionCode: profile?.connection_code
    };
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Busca perfil no banco para evitar dependência apenas do metadata
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(mapUser(session, profile));
        }
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      } finally {
        setIsLoading(false); // Garante o fim do carregamento infinito
      }
    };

    initSession();

    // Escuta mudanças sem gerar loops infinitos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(mapUser(session, profile));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role: role } }
    });
    if (error) throw error;

    if (data.user) {
      const { error: pError } = await supabase.from('profiles').insert([
        { id: data.user.id, full_name: name, role, email }
      ]);
      if (pError) throw pError;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};
