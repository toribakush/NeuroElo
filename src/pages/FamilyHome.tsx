import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { Plus, LogOut, Copy, Check, Sun, Moon, AlertCircle, Activity, Sunrise, Trash2 } from 'lucide-react'; // <--- Adicionei Trash2
import { Button } from '@/components/ui/button';
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
  const [isDeleting, setIsDeleting] = useState(false); // Estado para evitar cliques duplos

  // 1. Busca Perfil
  const { data: profile } = useQuery({
    queryKey: ['my_profile'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      return data;
    },
    enabled: !!user?.id
  });

  // 2. Busca Logs
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['daily_logs'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 3. Cálculos de Insights
  const insights = useMemo(() => {
    if (!events || events.length === 0) return null;

    try {
      // A. Período
      let morning = 0, afternoon = 0, night = 0;
      events.forEach((e: any) => {
        if (!e.date) return;
        const h = new Date(e.date).getHours();
        if (isNaN(h)) return;

        if (h >= 6 && h < 12) morning++;
        else if (h >= 12 && h < 18) afternoon++;
        else night++;
      });

      let periodText = "Variado";
      let PeriodIcon = Activity;
      let iconColor = "#64748b"; 
      
      if (morning > afternoon && morning > night) { 
        periodText = "Manhã"; PeriodIcon = Sunrise; iconColor = "#eab308"; 
      } else if (afternoon > morning && afternoon > night) { 
        periodText = "Tarde"; PeriodIcon = Sun; iconColor = "#f97316"; 
      } else if (night > morning && night > afternoon) { 
        periodText = "Noite"; PeriodIcon = Moon; iconColor = "#3b82f6"; 
      }

      // B. Gatilho Top
      const triggers: Record<string, number> = {};
      events.forEach((e: any) => {
        if (Array.isArray(e.triggers)) {
          e.triggers.forEach((t: string) => { triggers[t] = (triggers[t] || 0) + 1; });
        }
      });
      const topTriggerEntry = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0];
      const topTrigger = topTriggerEntry ? (TRIGGER_LABELS[topTriggerEntry[0] as keyof typeof TRIGGER_LABELS] || topTriggerEntry[0]) : '-';

      // C. Matriz de Calor
      const matrix = Array(7).fill(0).map(() => Array(24).fill(0));
      events.forEach((log: any) => {
         if (!log.date) return;
         const d = new Date(log.date);
         if (isNaN(d.getTime())) return;
         const day = d.getDay();
         const hour = d.getHours();
         if (matrix[day]) matrix[day][hour]++;
      });

      return { periodText, PeriodIcon, iconColor, topTrigger, matrix };
    } catch (error) {
      console.error("Erro insights:", error);
      return null;
    }
  }, [events]);

  // Lógica Código
  useEffect(() => {
    if (profile && !profile.connection_code) {
      const gen = async () => {
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        await supabase.from('profiles').update({ connection_code: code }).eq('id', user?.id);
        queryClient.invalidateQueries({ queryKey: ['my_profile'] });
      };
      gen();
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

  // --- NOVA FUNÇÃO DE EXCLUIR ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('daily_logs').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Registro excluído" });
      // Atualiza a lista automaticamente
      queryClient.invalidateQueries({ queryKey: ['daily_logs'] });
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Olá, {user?.name?.split(' ')[0] || 'Família'}</h1>
            <p className="text-sm text-muted-foreground">Seu resumo de hoje</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <main className="px-6 space-y-4">
        
        {/* Código */}
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

        {/* --- CARDS DE INSIGHTS --- */}
        {insights ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Card Período */}
            <div 
              className="card-elevated p-4 flex flex-col items-center justify-center text-center"
              style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}
            >
              <insights.PeriodIcon className="w-8 h-8 mb-2" style={{ color: insights.iconColor }} />
              <p className="text-xs text-gray-500">Pior Período</p>
              <p className="text-lg font-bold" style={{ color: insights.iconColor }}>{insights.periodText}</p>
            </div>

            {/* Card Gatilho */}
            <div 
              className="card-elevated p-4 flex flex-col items-center justify-center text-center"
              style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5' }}
            >
              <AlertCircle className="w-8 h-8 mb-2" style={{ color: '#f97316' }} />
              <p className="text-xs text-gray-500">Principal Gatilho</p>
              <p className="text-lg font-bold" style={{ color: '#c2410c' }}>{insights.topTrigger}</p>
            </div>
          </div>
        ) : (
          <div className="card-elevated p-6 text-center">
            <p className="text-sm text-muted-foreground">Registre eventos para ver seus padrões.</p>
          </div>
        )}

        {/* --- VISUAL DE BLOCOS --- */}
        {insights && (
          <div className="card-elevated p-4">
             <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Intensidade Semanal</h3>
                <span className="text-[10px] text-muted-foreground">Madrugada → Noite</span>
             </div>
             <div className="flex justify-between">
                {DAYS_OF_WEEK.map((day, dIdx) => (
                  <div key={dIdx} className="flex flex-col gap-1 items-center">
                    {[0, 1, 2, 3].map((block) => {
                      let count = 0;
                      if (insights.matrix && insights.matrix[dIdx]) {
                        for(let h=0; h<6; h++) {
                           const val = insights.matrix[dIdx][(block*6)+h];
                           if (typeof val === 'number') count += val;
                        }
                      }
                      
                      return (
                        <div 
                          key={block}
                          className="w-8 h-6 rounded-sm transition-all"
                          style={{ 
                            backgroundColor: count > 0 ? '#ef4444' : '#f3f4f6', 
                            opacity: count > 0 ? Math.min(1, 0.4 + (count * 0.2)) : 1 
                          }}
                        />
                      );
                    })}
                    <span className="text-[10px] text-muted-foreground mt-1">{day}</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Lista Recente com botão de EXCLUIR */}
        <div>
          <h2 className="text-base font-semibold mb-3 ml-1">Últimos Registros</h2>
          <div className="space-y-2">
            {events.slice(0, 5).map((event: any) => (
              <div key={event.id} className="bg-card border rounded-lg p-3 flex items-center gap-3 shadow-sm group">
                {/* Bolinha Colorida */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${EVENT_TYPE_COLORS[event.mood as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-400'}`} />
                
                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{EVENT_TYPE_LABELS[event.mood as keyof typeof EVENT_TYPE_LABELS] || event.mood}</span>
                      <span className="text-xs text-muted-foreground">
                        {event.date ? format(new Date(event.date), 'dd/MM HH:mm') : '-'}
                      </span>
                   </div>
                   {event.notes && <p className="text-xs text-muted-foreground truncate">{event.notes}</p>}
                </div>

                {/* Botão de Lixeira (Discreto) */}
                <button 
                  onClick={() => handleDelete(event.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-70 hover:opacity-100"
                  disabled={isDeleting}
                  title="Excluir registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <button onClick={() => navigate('/log-event')} className="fab"><Plus className="w-8 h-8" /></button>
    </div>
  );
};

export default FamilyHome;
