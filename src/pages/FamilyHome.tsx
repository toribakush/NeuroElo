import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; 
import { Plus, LogOut, Activity, Sun, Moon, Sunrise, Pill, Calendar, Settings, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types';
import { format } from 'date-fns';

const FamilyHome: React.FC = () => {
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
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* Header Refinado */}
      <header className="p-8 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-20">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Bem-vindo de volta</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Olá, {user?.name?.split(' ')[0] || 'Felipe'}</h1>
        </div>
        <button onClick={signOut} className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 hover:text-red-500 transition-all border border-slate-100">
          <LogOut size={20} />
        </button>
      </header>

      <main className="px-6 space-y-8">
        {/* Banner de Registro - Agora em Navy Blue */}
        <section 
          onClick={() => navigate('/log-event')}
          className="bg-[#0F172A] rounded-[32px] p-8 text-white shadow-2xl shadow-slate-200 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">Novo Registro</h2>
            <p className="text-slate-400 text-xs font-medium">Como foi o evento de agora?</p>
          </div>
          <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
            <Plus size={24} className="text-white" />
          </div>
        </section>

        {/* Atalhos Rápidos com Cores Pastel Suaves */}
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => navigate('/medications')} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-[#F5F3FF] rounded-2xl flex items-center justify-center text-[#6D28D9] shadow-inner">
              <Pill size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800 tracking-tight">Medicamentos</p>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 cursor-pointer hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center text-[#15803D] shadow-inner">
              <Calendar size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800 tracking-tight">Histórico</p>
          </div>
        </div>

        {/* Atividade Recente - Estilo Minimalista Arredondado */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atividade Recente</h3>
            <span className="text-[10px] font-bold text-indigo-500 uppercase cursor-pointer">Ver tudo</span>
          </div>
          <div className="space-y-3">
            {events.slice(0, 3).map((event: any) => (
              <div key={event.id} className="bg-white rounded-[28px] p-5 flex items-center gap-5 shadow-sm border border-slate-50 transition-all hover:translate-x-1">
                <div className={`w-3 h-12 rounded-full ${EVENT_TYPE_COLORS[event.mood as keyof typeof EVENT_TYPE_COLORS] || 'bg-slate-200'} opacity-80`} />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{EVENT_TYPE_LABELS[event.mood as keyof typeof EVENT_TYPE_LABELS] || event.mood}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                    {format(new Date(event.date), 'dd MMM • HH:mm')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Barra de Navegação Flutuante - Alinhamento Corrigido */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-md h-20 bg-[#0F172A] rounded-[40px] shadow-2xl flex items-center justify-around px-8 z-50 border border-white/5">
        <button className="text-white/40 hover:text-white transition-colors p-2"><Activity size={24} /></button>
        
        {/* Botão de + Centralizado e Alinhado */}
        <div className="relative -top-2">
          <button 
            onClick={() => navigate('/log-event')} 
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#0F172A] shadow-xl border-[6px] border-[#F8FAFC] active:scale-90 transition-all"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>

        <button className="text-white/40 hover:text-white transition-colors p-2"><Settings size={24} /></button>
      </nav>
    </div>
  );
};

export default FamilyHome;
