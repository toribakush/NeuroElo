import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Users, Stethoscope, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// REMOVEMOS O useAuth E USAMOS O SUPABASE DIRETO
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'signin' | 'signup';
type SignupStep = 'role' | 'details';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  // const { signIn, signUp } = useAuth(); // NÃO USAMOS MAIS ISSO
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signupStep, setSignupStep] = useState<SignupStep>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // --- FUNÇÃO DE LOGIN REAL ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/'); // Vai para a Home
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Verifique email e senha.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNÇÃO DE CADASTRO REAL ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);
    
    try {
      // 1. Cria o usuário na autenticação do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: selectedRole, // Salva se é família ou médico
          },
        },
      });

      if (authError) throw authError;

      // 2. Tenta criar o perfil na tabela 'profiles' manualmente para garantir
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              full_name: name,
              role: selectedRole,
              // Gera um código aleatório simples se for família
              connection_code: selectedRole === 'family' ? '#' + Math.random().toString(36).substr(2, 6).toUpperCase() : null
            }
          ]);
          
          if (profileError) {
            console.log("Aviso: Perfil já existia ou erro ao criar perfil secundário:", profileError);
          }
      }

      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar (se necessário) ou faça login.',
      });
      
      // Dependendo da config do Supabase, pode logar direto ou pedir login
      // Vamos tentar logar direto ou mandar pro login
      if (authData.session) {
        navigate('/');
      } else {
        setMode('signin'); // Manda o usuário fazer login
      }

    } catch (error: any) {
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setSignupStep('details');
  };

  // ... (O RESTO DO SEU JSX/HTML CONTINUA IGUAL ABAIXO) ...
  // Mantenha todo o return (...) que você já tem, ele está perfeito.
  // Só certifique-se de fechar as chaves e o componente no final.
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-calm flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">NeuroElo</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          {mode === 'signin' ? (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Olá novamente
                </h1>
                <p className="text-muted-foreground">
                  Faça login para continuar
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center mt-6 text-muted-foreground">
                Não tem uma conta?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setSignupStep('role');
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          ) : signupStep === 'role' ? (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Bem-vindo ao NeuroElo
                </h1>
                <p className="text-muted-foreground">
                  Como você vai usar o app?
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect('family')}
                  className="w-full card-interactive p-6 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Sou Familiar
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Vou registrar eventos e acompanhar o dia a dia
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('professional')}
                  className="w-full card-interactive p-6 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Sou Profissional
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Vou acompanhar pacientes e analisar dados
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center mt-6 text-muted-foreground">
                Já tem uma conta?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary font-semibold hover:underline"
                >
                  Faça login
                </button>
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={() => setSignupStep('role')}
                className="text-muted-foreground text-sm mb-6 hover:text-foreground transition-colors"
              >
                ← Voltar
              </button>

              <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                  selectedRole === 'family' ? 'bg-accent/10' : 'bg-primary/10'
                }`}>
                  {selectedRole === 'family' ? (
                    <Users className="w-8 h-8 text-accent" />
                  ) : (
                    <Stethoscope className="w-8 h-8 text-primary" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {selectedRole === 'family' ? 'Cadastro Familiar' : 'Cadastro Profissional'}
                </h1>
                <p className="text-muted-foreground">
                  Preencha seus dados
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-12 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  variant={selectedRole === 'family' ? 'default' : 'default'} // Ajustado para evitar erro se 'accent' não existir
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Criar conta
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
