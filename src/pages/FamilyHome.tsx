import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Activity, Pill, Calendar, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FamilyHome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);

  // Carregamento manual para evitar travamento do useQuery
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id) {
          const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).limit(3);
          if (data) setEvents(data);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Erro ao carregar dados", e);
        }
      } finally {
        setInternalLoading(false); // Força a saída do estado de carregamento
      }
    };
    loadData();
    
    // Timer de segurança: se em 5 segundos não carregar, libera a tela
    const timer = setTimeout(() => setInternalLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40">
      <header className="p-8 flex justify-between items-center bg-white border-b border-slate-50">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">NeuroElo</p>
          <h1 className="text-2xl font-black text-[#0F172A] mt-1">Olá, {user?.name?.split(' ')[0] || 'Felipe'}</h1>
        </div>
        <button onClick={signOut} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
          <LogOut size={22} />
        </button>
      </header>

      <main className="px-6 py-8 space-y-6">
        {/* Card Navy Blue */}
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

        {/* Atalhos Coloridos */}
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => navigate('/medications')} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer">
            <div className="w-12 h-12 bg-[#F5F3FF] rounded-2xl flex items-center justify-center text-[#6D28D9]">
              <Pill size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Rotina de Remédios</p>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer">
            <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center text-[#15803D]">
              <Calendar size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Histórico</p>
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="space-y-4 pt-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Atividade Recente</h3>
          {events.length > 0 ? events.map((event: any) => (
            <div key={event.id} className="bg-white rounded-[24px] p-5 flex items-center justify-between shadow-sm border border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-indigo-500 rounded-full opacity-30" />
                <p className="font-bold text-slate-700 text-sm">{event.mood}</p>
              </div>
              <ChevronRight size={18} className="text-slate-200" />
            </div>
          )) : (
            <p className="text-center text-slate-400 text-xs py-4 italic">Nenhum registro encontrado hoje.</p>
          )}
        </div>
      </main>

      {/* Menu Inferior Navy */}
      <div className="fixed bottom-10 left-0 right-0 px-8 flex justify-center">
        <nav className="w-full max-w-md h-20 bg-[#0F172A] rounded-[40px] shadow-2xl flex items-center justify-around relative border border-white/5">
          <button className="text-white/40"><Activity size={24} /></button>
          
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <button 
              onClick={() => navigate('/log-event')}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#0F172A] shadow-2xl border-[8px] border-[#F8FAFC] active:scale-90 transition-all"
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
