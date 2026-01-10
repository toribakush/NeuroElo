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

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id) {
          const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
          if (data) setEvents(data);
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setInternalLoading(false);
      }
    };
    loadData();
    const timer = setTimeout(() => setInternalLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40 font-sans">
      {/* Header Premium */}
      <header className="p-8 flex justify-between items-end bg-white border-b border-slate-50">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">NeuroElo</p>
          <h1 className="text-2xl font-black text-[#0F172A] mt-2">Olá, {user?.name?.split(' ')[0] || 'Felipe'}</h1>
        </div>
        <button onClick={signOut} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90">
          <LogOut size={20} />
        </button>
      </header>

      <main className="px-6 py-8 space-y-8">
        {/* Card Navy Blue Principal */}
        <div 
          onClick={() => navigate('/log-event')}
          className="bg-[#0F172A] rounded-[32px] p-8 text-white shadow-2xl flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-black">Novo Registro</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Registre o evento agora</p>
          </div>
          <div className="bg-white/10 p-5 rounded-[24px] relative z-10 group-hover:bg-white group-hover:text-[#0F172A] transition-all">
            <Plus size={28} strokeWidth={3} />
          </div>
          {/* Efeito de brilho sutil no fundo do card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
        </div>

        {/* Grid de Atalhos com Cantos de 32px */}
        <div className="grid grid-cols-2 gap-5">
          <div onClick={() => navigate('/medications')} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-48 cursor-pointer hover:shadow-md transition-all active:scale-95">
            <div className="w-14 h-14 bg-[#F5F3FF] rounded-[20px] flex items-center justify-center text-[#6D28D9]">
              <Pill size={28} />
            </div>
            <p className="text-base font-black text-slate-800 leading-tight">Rotina de<br/>Remédios</p>
          </div>

          <div onClick={() => navigate('/history')} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-48 cursor-pointer hover:shadow-md transition-all active:scale-95">
            <div className="w-14 h-14 bg-[#F0FDF4] rounded-[20px] flex items-center justify-center text-[#15803D]">
              <Calendar size={28} />
            </div>
            <p className="text-base font-black text-slate-800 leading-tight">Ver Meu<br/>Histórico</p>
          </div>
        </div>

        {/* Lista de Registros Estilizada */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Atividade Recente</h3>
          {events.length > 0 ? events.map((event: any) => (
            <div key={event.id} className="bg-white rounded-[28px] p-6 flex items-center justify-between shadow-sm border border-slate-50 hover:border-indigo-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-indigo-500 rounded-full opacity-20" />
                <div>
                  <p className="font-black text-slate-800 text-sm capitalize">{event.mood || 'Registro'}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Hoje, às {new Date(event.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          )) : (
            <div className="bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 py-10 flex flex-col items-center">
              <p className="text-slate-400 text-xs font-bold italic">Nenhum registro encontrado hoje.</p>
            </div>
          )}
        </div>
      </main>

      {/* Menu Inferior Navy Flutuante */}
      <div className="fixed bottom-10 left-0 right-0 px-8 flex justify-center z-50">
        <nav className="w-full max-w-md h-20 bg-[#0F172A] rounded-[40px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-around relative border border-white/10 backdrop-blur-sm">
          <button className="text-white/40 hover:text-white transition-all"><Activity size={24} /></button>
          
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <button 
              onClick={() => navigate('/log-event')}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#0F172A] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] border-[8px] border-[#F8FAFC] active:scale-90 transition-all"
            >
              <Plus size={32} strokeWidth={4} />
            </button>
          </div>

          <button className="text-white/40 hover:text-white transition-all"><Settings size={24} /></button>
        </nav>
      </div>
    </div>
  );
};

export default FamilyHome;
