import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { Plus, Calendar, TrendingUp, LogOut, Copy, Check, Loader2, Sun, Moon, Sunrise, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, TRIGGER_LABELS } from '@/types';

// Configuração simples do Heatmap
const DAYS_OF_WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const HOURS = [0, 6, 12, 18]; // Simplificado para visualização rápida

const FamilyHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // --- 1. DADOS DO PERFIL ---
  const { data: profile } = useQuery({
    queryKey: ['my_profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // --- 2. DADOS DO DIÁRIO ---
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['daily_logs'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // --- 3. CÁLCULO DE INSIGHTS (A MÁGICA SIMPLES) ---
  const insights = useMemo(() => {
    if (events.length === 0) return null;

    // A. Período do dia mais crítico
    let morning = 0, afternoon = 0, night = 0;
    events.forEach((e: any) => {
      const hour = new Date(e.date).getHours();
      if (hour >= 6 && hour < 12) morning++;
      else if (hour >= 12 && hour < 18) afternoon++;
      else night++;
    });

    let periodText = "Variado";
    let PeriodIcon = Sun;
    if (morning > afternoon && morning > night) { periodText = "Manhã"; PeriodIcon = Sunrise; }
    if (afternoon > morning && afternoon > night) { periodText = "Tarde"; PeriodIcon = Sun; }
    if (night > morning && night > afternoon) { periodText = "Noite"; PeriodIcon = Moon; }

    // B. Gatilho mais comum
    const triggers: Record<string, number> = {};
    events.forEach((e: any) => {
      e.triggers?.forEach((t: string) => {
        triggers[t] = (triggers[t] || 0) + 1;
      });
    });
    const topTrigger = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0];
    
    // C. Matriz Simplificada para o visual
    const matrix = Array(7).fill(0).map(() => Array(24).fill(0));
    events.forEach((log: any) => {
       const d = new Date(log.date);
       matrix[d.getDay()][d.getHours()]++;
    });

    return { periodText, PeriodIcon, topTrigger, matrix };
  }, [events]);


  // Lógica de gerar código (igual anterior)
  useEffect(() => {
    if (profile && !profile.connection_code) {
      const generate = async () => {
        const newCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        await supabase.from('profiles').update({ connection_code: newCode }).eq('id', user?.id);
        queryClient.invalidateQueries({ queryKey: ['my_profile'] });
      };
      generate();
    }
  }, [profile]);

  const handleCopyCode = () => {
    if (profile?.connection_code) {
      navigator.clipboard.writeText(profile.connection_code);
      setCopied(true);
      toast({ title: 'Copiado!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Simplificado */}
      <header className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {user?.name?.split(' ')[0] || 'Família'}
            </h1>
            <p className="text-sm text-muted-foreground">Vamos ver como você está hoje?</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 space-y-5">
        
        {/* Código de Conexão (Compacto) */}
        {profile?.connection_code && (
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-xl border border-dashed border-muted-foreground/30">
             <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Seu Código:</span>
                <span className="font-mono font-bold text-lg tracking-wider text-foreground">{profile.connection_code}</span>
             </div>
             <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-8 w-8 p-0">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
             </Button>
          </div>
        )}

        {/* 1. RESUMO INTELIGENTE (NOVO) */}
        {insights ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Card Período */}
            <div className="card-elevated p-4 flex flex-col items-center justify-center text-center bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
              <insights.PeriodIcon className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-xs text-muted-foreground">Período mais ativo</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{insights.periodText}</p>
            </div>

            {/* Card Gatilho */}
            <div className="card-elevated p-4 flex flex-col items-center justify-center text-center bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
              <AlertCircle className="w-8 h-8 text-orange-500 mb-2" />
              <p className="text-xs text-muted-foreground">Principal Gatilho</p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                {insights.topTrigger ? (TRIGGER_LABELS[insights.topTrigger[0] as keyof typeof TRIGGER_LABELS] || insights.topTrigger[0]) : '-'}
              </p>
            </div>
          </div>
        ) : (
          <div className="card-elevated p-6 text-center">
            <p className="text-sm text-muted-foreground">Faça seu primeiro registro para ver seus resumos!</p>
          </div>
        )}

        {/* 2. MAPA DE CALOR VISUAL (SIMPLIFICADO) */}
        {insights && (
          <div className="card-elevated p-4">
             <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Visão da Semana</h3>
                <span className="text-[10px] bg-secondary px-2 py-1 rounded text-muted-foreground">Vermelho = Mais intenso</span>
             </div>
             
             {/* Visualização de "Pixels" */}
             <div className="flex justify-between">
                {DAYS_OF_WEEK.map((dayLabel, dIndex) => (
                  <div key={dIndex} className="flex flex-col gap-1 items-center">
                    {/* Blocos do dia (agrupados em 4 turnos para simplificar) */}
                    {[0, 1, 2, 3].map((block) => {
                      // Soma simplificada de 6 horas por bloco
                      let count = 0;
                      for(let h=0; h<6; h++) count += insights.matrix[dIndex][(block*6)+h];
                      
                      return (
                        <div 
                          key={block}
                          className={`w-8 h-6 rounded-sm transition-all ${count > 0 ? 'bg-red-400' : 'bg-gray-100 dark:bg-gray-800'}`}
                          style={{ opacity: count > 0 ? Math.min(1, 0.4 + (count * 0.2)) : 1 }}
                        />
                      );
                    })}
                    <span className="text-[10px] font-medium text-muted-foreground mt-1">{dayLabel}</span>
                  </div>
                ))}
             </div>
             {/* Legenda Lateral (Turnos) */}
             <div className="absolute left-2 top-[88px] flex flex-col gap-[18px] text-[8px] text-muted-foreground opacity-0">
               <span>Madru.</span><span>Manhã</span><span>Tarde</span><span>Noite</span>
             </div>
          </div>
        )}

        {/* 3. LISTA RECENTE (Compacta) */}
        <div>
          <h2 className="text-base font-semibold mb-3 ml-1">Últimos Registros</h2>
          <div className="space-y-2">
            {events.slice(0, 3).map((event: any) => (
              <div key={event.id} className="bg-card border rounded-lg p-3 flex items-center gap-3 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${EVENT_TYPE_COLORS[event.mood as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-400'}`} />
                <div className="flex-1">
                   <div className="flex justify-between">
                      <span className="font-medium text-sm">{EVENT_TYPE_LABELS[event.mood as keyof typeof EVENT_TYPE_LABELS] || event.mood}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(event.date), 'dd/MM HH:mm')}</span>
                   </div>
                   {event.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Botão Flutuante (FAB) */}
      <button 
        onClick={() => navigate('/log-event')} 
        className="fab animate-in zoom-in duration-300"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};

export default FamilyHome;
