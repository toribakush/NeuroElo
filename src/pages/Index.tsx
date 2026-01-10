import React, { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Code splitting: Load role-specific components only when needed
// This prevents exposing professional UI code to family users
const FamilyHome = lazy(() => import('./FamilyHome'));
const ProfessionalHome = lazy(() => import('./ProfessionalHome'));

const LoadingSpinner = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const Index = () => {
  const { user, isLoading } = useAuth();

  // 1. Enquanto carrega o usuário, mostra um loading girando
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 2. Se não estiver logado, o AuthContext geralmente já redireciona para /auth.
  // Mas por segurança, se não tiver usuário, não renderiza nada (ou redireciona).
  if (!user) {
    return null; 
  }

  // 3. O GRANDE DESVIO: Verifica se é Profissional ou Família
  // Role is securely fetched from user_roles table via RLS
  const isProfessional = user?.role === 'professional';

  // 4. Render with Suspense for code splitting
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isProfessional ? <ProfessionalHome /> : <FamilyHome />}
    </Suspense>
  );
};

export default Index;
