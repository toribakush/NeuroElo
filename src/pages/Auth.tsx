import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, getSafeErrorMessage } from '@/lib/validation';
import { z } from 'zod';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'family' | 'professional'>('family');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redireciona se o usuário já estiver logado para evitar o loop de Auth
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate input before submission
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          setLoading(false);
          toast({
            title: "Dados inválidos",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }

        // Realiza o login via Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });

        if (error) throw error;

        if (data?.user) {
          toast({ title: "Sucesso!", description: "Entrando no sistema..." });
          window.location.href = "/"; 
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, fullName, role });
        if (!validation.success) {
          setLoading(false);
          toast({
            title: "Dados inválidos",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }

        await signUp(validation.data.email, validation.data.password, validation.data.fullName, validation.data.role);
        toast({ title: "Conta criada!", description: "Bem-vindo ao NeuroElo" });
      }
    } catch (error: unknown) {
      setLoading(false);
      toast({
        title: "Erro na autenticação",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 w-full max-w-md border border-slate-50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            {isLogin ? 'Bem-vindo' : 'Criar Conta'}
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-2">
            Acesse o seu painel de cuidado
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#0F172A]/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#0F172A]/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="exemplo@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-12 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#0F172A]/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#0F172A] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRole('family')}
                className={`h-12 rounded-2xl text-xs font-bold transition-all ${
                  role === 'family' ? 'bg-[#0F172A] text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400'
                }`}
              >
                Família
              </button>
              <button
                type="button"
                onClick={() => setRole('professional')}
                className={`h-12 rounded-2xl text-xs font-bold transition-all ${
                  role === 'professional' ? 'bg-[#0F172A] text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400'
                }`}
              >
                Profissional
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-16 bg-[#0F172A] text-white rounded-[24px] font-bold text-lg shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 mt-4"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin text-white" /> : (isLogin ? 'Acessar App' : 'Criar minha conta')}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-slate-50 pt-8">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-[#0F172A] text-sm font-bold transition-all"
          >
            {isLogin ? 'Não tem conta? Comece aqui' : 'Já sou cadastrado'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
