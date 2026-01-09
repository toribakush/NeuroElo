import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; 
import { Plus, LogOut, Activity, Pill, Calendar, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const FamilyHome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: events = [] } = useQuery({
    queryKey: ['daily_logs'],
    queryFn: async () => {
      const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user?.id).order('date', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40">
      <header className="p-8 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Painel NeuroElo</p>
          <h1 className="text-2xl font-black text-[#0F172A]">Olá, {user?.name?.split(' ')[0] || 'Felipe'}</h1>
        </div>
        <button onClick={signOut} className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 hover:text-red-500 border border-slate-100 transition-all">
          <LogOut size={20} />
        </button>
      </header>

      <main className="px-6 space-y-6">
        {/* Banner Principal Navy */}
        <section 
          onClick={() => navigate('/log-event')}
          className="bg-[#0F172A] rounded-[32px] p-8 text-white shadow-2xl flex justify-between items-center cursor-pointer active:scale-95 transition-all"
        >
          <div>
            <h2 className="text-xl font-bold">Novo Registro</h2>
            <p className="text-slate-400 text-xs mt-1">Como foi o evento de agora?</p>
          </div>
          <div className="bg-white/10 p-4 rounded-3xl border border-white/10">
            <Plus size={24} />
          </div>
        </section>

        {/* Cards de Atalho com Cores Pastel */}
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => navigate('/medications')} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-[#F5F3FF] rounded-2xl flex items-center justify-center text-[#6D28D9]">
              <Pill size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Medicamentos</p>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center text-[#15803D]">
              <Calendar size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Histórico</p>
          </div>
        </div>

        {/* Atividade Recente - Cards Suaves */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Atividade Recente</h3>
          <div className="space-y-3">
            {events.slice(0, 3).map((event: any) => (
              <div key={event.id} className="bg-white rounded-[28px] p-5 flex items-center justify-between shadow-sm border border-slate-50 hover:translate-x-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 bg-indigo-500 rounded-full opacity-40" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{event.mood}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {event.date ? format(new Date(event.date), 'HH:mm') : '--:--'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Barra de Navegação Flutuante Alinhada */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[85%] max-w-md">
        <nav className="h-20 bg-[#0F172A] rounded-[40px] shadow-2xl flex items-center justify-around px-8 border border-white/5 relative">
          <button className="text-white/40 hover:text-white transition-colors"><Activity size={24} /></button>
          
          {/* Botão + Centralizado e Elevado */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <button 
              onClick={() => navigate('/log-event')}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#0F172A] shadow-2xl border-[8px] border-[#F8FAFC] active:scale-90 transition-all"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          <button className="text-white/40 hover:text-white transition-colors"><Settings size={24} /></button>
        </nav>
      </div>
    </div>
  );
};

export default FamilyHome;
