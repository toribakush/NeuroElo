import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; 
import { Plus, LogOut, Activity, Pill, Calendar, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FamilyHome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Busca simplificada para evitar erros de renderização
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['daily_logs'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).limit(3);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Se o Auth ainda estiver processando, mostramos um fundo Navy sólido
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40 font-sans">
      <header className="p-8 flex justify-between items-center bg-white border-b border-slate-50">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NeuroElo</p>
          <h1 className="text-2xl font-black text-[#0F172A]">Olá, {user?.name?.split(' ')[0] || 'Usuário'}</h1>
        </div>
        <button onClick={signOut} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
          <LogOut size={22} />
        </button>
      </header>

      <main className="px-6 py-8 space-y-6">
        {/* Card Navy Blue - Alinhado com a referência */}
        <div 
          onClick={() => navigate('/log-event')}
          className="bg-[#0F172A] rounded-[32px] p-8 text-white shadow-2xl flex justify-between items-center cursor-pointer active:scale-95 transition-all"
        >
          <div>
            <h2 className="text-xl font-bold">Novo Registro</h2>
            <p className="text-slate-400 text-xs mt-1">Registre o evento agora</p>
          </div>
          <div className="bg-white/10 p-4 rounded-[20px]">
            <Plus size={24} />
          </div>
        </div>

        {/* Chips de Atalho */}
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => navigate('/medications')} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer">
            <div className="w-12 h-12 bg-[#F5F3FF] rounded-2xl flex items-center justify-center text-[#6D28D9]">
              <Pill size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Medicamentos</p>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer">
            <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center text-[#15803D]">
              <Calendar size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Histórico</p>
          </div>
        </div>

        {/* Recentes */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Últimos Registros</h3>
          {events.map((event: any) => (
            <div key={event.id} className="bg-white rounded-[24px] p-5 flex items-center justify-between shadow-sm border border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-indigo-500 rounded-full opacity-30" />
                <p className="font-bold text-slate-700 text-sm">{event.mood}</p>
              </div>
              <ChevronRight size={18} className="text-slate-200" />
            </div>
          ))}
        </div>
      </main>

      {/* Barra de Navegação Flutuante Alinhada */}
      <div className="fixed bottom-10 left-0 right-0 px-8 flex justify-center">
        <nav className="w-full max-w-md h-20 bg-[#0F172A] rounded-[40px] shadow-2xl flex items-center justify-around relative border border-white/5">
          <button className="text-white/40"><Activity size={24} /></button>
          
          {/* O Botão de + Elevado e Centralizado */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <button 
              onClick={() => navigate('/log-event')}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#0F172A] shadow-2xl border-[8px] border-[#F8FAFC]"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          <button className="text-white/40"><Settings size={24} /></button>
        </nav>
      </div>
    </div>
  );
};

export default FamilyHome;
