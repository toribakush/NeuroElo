import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { Plus, Calendar, LogOut, Copy, Check, Loader2, Sun, Moon, Sunrise, AlertCircle, Activity } from 'lucide-react';
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

  // 1. Busca Perfil
  const { data: profile } = useQuery({
    queryKey: ['my_profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // 2. Busca Logs
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

  // 3. Cálculos de Insights (Resumo)
  const insights = useMemo(() => {
    if (events.length === 0) return null;

    // A. Período
    let morning = 0, afternoon = 0, night = 0;
    events.forEach((e: any) => {
      const h = new Date(e.date).getHours();
      if (h >= 6 && h < 12) morning++;
      else if (h >= 12 && h < 18) afternoon++;
      else night++;
    });
    let periodText = "Variado";
    let PeriodIcon = Activity;
    if (morning > afternoon && morning > night) { periodText = "Manhã"; PeriodIcon = Sunrise; }
    else if (afternoon > morning && afternoon > night) { periodText = "Tarde"; PeriodIcon = Sun; }
    else if (night > morning && night > afternoon) { periodText = "Noite"; PeriodIcon = Moon; }

    // B. Gatilho Top
    const triggers: Record<string, number> = {};
    events.forEach((e: any) => {
      e.triggers?.forEach((t: string) => { triggers[t] = (triggers[t] || 0) + 1; });
    });
    const topTriggerEntry = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0];
    const topTrigger = topTriggerEntry ? (TRIGGER_LABELS[topTriggerEntry[0] as keyof typeof TRIGGER_LABELS] || topTriggerEntry[0]) : '-';

    // C. Matriz de Calor Simplificada
    const matrix = Array(7).fill(0).map(() => Array(24).fill(0));
    events.forEach((log: any) => {
       const d = new Date(log.date);
       matrix[d.getDay()][d.getHours()]++;
    });

    return { periodText, PeriodIcon, topTrigger, matrix };
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
        
        {/* Código de Conexão */}
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

        {/* --- CARDS DE INSIGHTS (NOVO) --- */}
        {insights ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="card-elevated p-4 flex flex-col items-center justify-center text-center bg-blue-50/50 border-blue-100">
              <insights.PeriodIcon className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-xs text-muted-foreground">Pior Período</p>
              <p className="text-lg font-bold text-blue-700">{insights.periodText}</p>
            </div>
            <div className="card-elevated p-4 flex flex-col items-center justify-center text-center bg-orange-50/50 border-orange-100">
              <AlertCircle className="w-8 h-8 text-orange-500 mb-2" />
