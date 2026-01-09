import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FamilyHome from './FamilyHome';
import ProfessionalHome from './ProfessionalHome';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();

  // 1. Enquanto carrega o usuário, mostra um loading girando
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Se não estiver logado, o AuthContext geralmente já redireciona para /auth.
  // Mas por segurança, se não tiver usuário, não renderiza nada (ou redireciona).
  if (!user) {
    return null; 
  }

  // 3. O GRANDE DESVIO: Verifica se é Profissional ou Família
  // Verifica se o 'role' está salvo nos metadados do usuário ou na propriedade direta
  const isProfessional = user?.role === 'professional';

  if (isProfessional) {
    return <ProfessionalHome />;
  }

  // 4. Se não for profissional, assume que é Família
  // Isso vai renderizar o FamilyHome.tsx que editamos (com o código de conexão)
  return <FamilyHome />;
};

export default Index;
