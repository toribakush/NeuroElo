import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types';

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => void;
  updateConnectionCode: (code: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('neuroelo_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For demo, check stored users or use mock data
    const storedUsers = JSON.parse(localStorage.getItem('neuroelo_users') || '[]');
    const existingUser = storedUsers.find((u: AuthUser) => u.email === email);
    
    if (existingUser) {
      setUser(existingUser);
      localStorage.setItem('neuroelo_user', JSON.stringify(existingUser));
    } else {
      throw new Error('Usuário não encontrado. Por favor, faça o cadastro.');
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const connectionCode = role === 'family' 
      ? `#${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      : undefined;
    
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      email,
      name,
      role,
      connectionCode,
    };
    
    // Store user
    const storedUsers = JSON.parse(localStorage.getItem('neuroelo_users') || '[]');
    storedUsers.push(newUser);
    localStorage.setItem('neuroelo_users', JSON.stringify(storedUsers));
    
    setUser(newUser);
    localStorage.setItem('neuroelo_user', JSON.stringify(newUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('neuroelo_user');
  };

  const updateConnectionCode = (code: string) => {
    if (user) {
      const updatedUser = { ...user, connectionCode: code };
      setUser(updatedUser);
      localStorage.setItem('neuroelo_user', JSON.stringify(updatedUser));
      
      const storedUsers = JSON.parse(localStorage.getItem('neuroelo_users') || '[]');
      const updatedUsers = storedUsers.map((u: AuthUser) => 
        u.id === user.id ? updatedUser : u
      );
      localStorage.setItem('neuroelo_users', JSON.stringify(updatedUsers));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateConnectionCode }}>
      {children}
    </AuthContext.Provider>
  );
};
