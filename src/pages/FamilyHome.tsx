import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { Plus, LogOut, Copy, Check, Sun, Moon, AlertCircle, Activity, Calendar } from 'lucide-react'; // Removi ícones que podem não existir na sua versão
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

  // 3. Cálculos de Insights (Versão Segura)
  const insights = useMemo(() => {
    if (!events || events.length === 0) return null;

    try {
      // A. Período
      let morning = 0, afternoon = 0, night = 0;
      events.forEach((e: any) => {
        if (!e.date) return;
        const h = new Date(e.date).getHours();
        if (isNaN(h)) return; // Proteção contra datas inválidas

        if (h >= 6 && h < 12) morning++;
        else if (h >= 12 && h < 18) afternoon++;
        else night++;
      });

      let periodText = "Variado";
      let PeriodIcon = Activity; // Usando Activity como fallback seguro
      
      if (morning > afternoon && morning > night) { periodText = "Manhã"; PeriodIcon = Sun; }
      else if (afternoon > morning && afternoon > night) { periodText = "Tarde"; PeriodIcon = Sun; }
      else if (night > morning && night > afternoon) { periodText = "Noite"; PeriodIcon = Moon; }

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
         // Proteção extra para índices
         if (matrix[day] && matrix[day][hour] !== undefined) {
            matrix[day][hour]++;
         }
      });

      return { periodText, PeriodIcon, topTrigger, matrix };
    } catch (error) {
      console.error("Erro ao calcular insights:", error);
      return null; // Se der erro, retorna null e mostra a tela padrão
    }
  }, [events]);

  // Lógica Código
  useEffect(() => {
    if (profile && !profile.connection_code) {
      const gen = async () => {
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        await supabase.from('profiles').update({ connection_code: code }).eq('id', user?.id);
        query
