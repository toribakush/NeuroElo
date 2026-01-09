import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { Plus, LogOut, Copy, Check, Sun, Moon, AlertCircle, Activity, Sunrise, Trash2, Pill, ChevronRight, Settings, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, TRIGGER_LABELS } from '@/types';

const DAYS_OF_WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const FamilyHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my_profile'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      return data;
    },
    enabled: !!user?.id
  });

  const { data: events = [] } = useQuery({
    queryKey: ['daily_logs'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).order('date', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const insights = useMemo(() => {
    if (!events || events.length === 0) return null;
    try {
      let morning = 0, afternoon = 0, night = 0;
      events.forEach((e: any) => {
        const h = new Date(e.date).getHours();
        if (h >= 6 && h < 12) morning++;
        else if (h >= 12 && h < 18) afternoon++;
        else night++;
      });

      let periodText = "Variado";
      let PeriodIcon = Activity;
      let iconBg = "bg-slate-100";
      let iconColor = "text-slate-600";
      
      if (morning > afternoon && morning > night) { 
        periodText = "Manhã"; PeriodIcon = Sunrise; iconBg = "bg-[#FEF3F2]"; iconColor = "text-[#991B1B]"; 
      } else if (afternoon > morning && afternoon > night) { 
        periodText = "Tarde"; PeriodIcon = Sun; iconBg = "bg-[#FFF7ED]"; iconColor = "text-[#9A3412]"; 
      } else if (night > morning && night > afternoon) { 
        periodText = "Noite"; PeriodIcon = Moon; iconBg = "bg-[#F0F9FF]"; iconColor = "text-[#075985]"; 
      }

      const triggers: Record<string, number> = {};
      events.forEach((e: any) => {
        if (Array.isArray(e.triggers)) {
          e.triggers.forEach((t: string) => { triggers[t] = (triggers[t] || 0) + 1; });
        }
      });
      const topTriggerEntry = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0];
      const topTrigger = topTriggerEntry ? (TRIGGER_LABELS[topTriggerEntry[0] as keyof typeof TRIGGER_LABELS] || topTriggerEntry[0]) : '-';

      const matrix = Array(7).fill(0).map(() => Array(24).fill(0));
      events.forEach((log: any) => {
         const d = new Date(log.date);
         matrix[d.getDay()][d.getHours()]++;
      });

      return { periodText, PeriodIcon, iconBg, iconColor, topTrigger, matrix };
    } catch (e) { return null; }
  }, [events]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <header className="p-6 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Bem-vindo</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Olá, {user?.name?.split(' ')[0] || 'Família'}</h1>
        </div>
        <button onClick={signOut} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="px-6 space-y-6">
        {/* Banner de Registro Rápido */}
        <section 
          onClick={() => navigate('/log-event')}
          className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all"
        >
          <div>
            <h2 className="text-xl font-bold mb-1">Novo Registro</h2>
            <p className="text-slate-400 text-xs">Como foi o evento de agora?</p>
          </div>
          <div className="bg-white/10 p-3 rounded-full"><Plus size={28} /></div>
        </section>

        {/* Grade de Cards Clean */}
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => navigate('/medications')} className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-36 cursor-pointer">
            <div className="w-10 h-10 bg-[#F3E8FF] rounded-full flex items-center justify-center text-[#6B21A8]"><Pill size={20} /></div>
            <p className="text-sm font-bold text-slate-800">Medicamentos</p>
          </div>

          <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-36 cursor-pointer">
            <div className="w-10 h-10 bg-[#DCFCE7] rounded-full flex items-center justify-center text-[#166534]"><Calendar size={20} /></div>
            <p className="text-sm font-bold text-slate-800">Histórico</p>
          </div>
        </div>

        {/* Insights Section */}
        {insights && (
          <section className="space-y-4">
            <div className="flex gap-3">
              <div className={`flex-1 ${insights.iconBg} rounded-[32px] p-5 border border-slate-100`}>
                <insights.PeriodIcon className={`w-8 h-8 mb-2 ${insights.iconColor}`} />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pior Horário</p>
                <p className={`text-lg font-black ${insights.iconColor}`}>{insights.periodText}</p>
              </div>
              <div className="flex-1 bg-[#FFF7ED] rounded-[32px] p-5 border border-slate-100">
                <AlertCircle className="w-8 h-8 mb-2 text-[#9A3412]" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Principal Gatilho</p>
                <p className="text-lg font-black text-[#9A3412] truncate">{insights.topTrigger}</p>
              </div>
            </div>
          </section>
        )}

        {/* Lista de Registros */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Atividade Recente</h3>
          {events.slice(0, 3).map((event: any) => (
            <div key={event.id} className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-slate-50 group">
              <div className={`w-2 h-10 rounded-full ${EVENT_TYPE_COLORS[event.mood as keyof typeof EVENT_TYPE_COLORS] || 'bg-slate-200'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{EVENT_TYPE_LABELS[event.mood as keyof typeof EVENT_TYPE_LABELS] || event.mood}</p>
                <p className="text-[10px] text-slate-400 font-medium">{format(new Date(event.date), 'dd/MM HH:mm')}</p>
              </div>
              <button onClick={() => handleDelete(event.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Navbar */}
      <nav className="fixed bottom-8 left-8 right-8 h-16 bg-slate-900 rounded-full shadow-2xl flex items-center justify-around px-8 z-50">
        <button className="text-white"><Activity size={24} /></button>
        <button onClick={() => navigate('/log-event')} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-lg -mt-10 border-4 border-[#F8FAFC]">
          <Plus size={28} />
        </button>
        <button className="text-slate-500"><Settings size={24} /></button>
      </nav>
    </div>
  );
};

export default FamilyHome;
