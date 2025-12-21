import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { Plus, Calendar, TrendingUp, LogOut, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types';

const FamilyHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // --- 1. BUSCA O PERFIL DO USUÁRIO (PARA PEGAR O CÓDIGO) ---
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

  // --- 2. GERADOR AUTOMÁTICO DE CÓDIGO ---
  // Se o perfil carregou e o código está vazio, cria um agora mesmo!
  useEffect(() => {
    const generateCode = async () => {
      if (profile && !profile.connection_code) {
        // Gera código aleatório de 5 digitos (Ex: A1B2C)
        const newCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        const { error } = await supabase
          .from('profiles')
          .update({ connection_code: newCode })
          .eq('id', user?.id);

        if (!error) {
          // Atualiza a tela para mostrar o código novo
          queryClient.invalidateQueries({ queryKey: ['my_profile'] });
        }
      }
    };
    generateCode();
  }, [profile, user?.id, queryClient]);


  // --- 3. BUSCA OS REGISTROS DO DIÁRIO ---
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

  // Cálculos
  const crisisEvents = events.filter((e: any) => e.mood === 'crise');
  const lastCrisis = crisisEvents[0];
  const daysWithoutCrisis = lastCrisis 
    ? Math.floor((Date.now() - new Date(lastCrisis.date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const recentEvents = events.slice(0, 5);

  const handleCopyCode = () => {
    if (profile?.connection_code) {
      navigator.clipboard.writeText(profile.connection_code);
      setCopied(true);
      toast({ title: 'Código copiado!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-1">
              Olá, {user?.name?.split(' ')[0] || 'Família'}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        
        {/* Connection Code - AGORA VAI APARECER SEMPRE */}
        <div className="card-elevated p-4 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Seu Código de Conexão</p>
                {profile?.connection_code ? (
                  <p className="text-3xl font-mono font-bold text-foreground mt-1 tracking-wider">
                    {profile.connection_code}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando código...
                  </div>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyCode} disabled={!profile?.connection_code}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Envie este código para o seu médico/terapeuta monitorar.
            </p>
        </div>

        {/* Streak Card */}
        <div className="card-elevated p-6 gradient-sage text-accent-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Dias sem crise severa</p>
              <p className="text-5xl font-bold mt-1">
                {isLoading ? '-' : daysWithoutCrisis}
              </p>
            </div>
            <Calendar className="w-12 h-12 opacity-50" />
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Registros Recentes</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Ver todos <TrendingUp className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : recentEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Toque no + para criar seu primeiro registro.</p>
            ) : (
              recentEvents.map((event: any) => (
                <div key={event.id} className="card-elevated p-4">
                  <div className="flex items-start gap-3">
                    <div className={`status-dot mt-1.5 ${EVENT_TYPE_COLORS[event.mood as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">
                          {EVENT_TYPE_LABELS[event.mood as keyof typeof EVENT_TYPE_LABELS] || event.mood}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.date), 'dd/MM HH:mm')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                         <p className="text-sm text-muted-foreground truncate pr-2">{event.notes}</p>
                         {event.intensity && (
                           <span className="text-xs font-bold bg-slate-100 px-2 rounded whitespace-nowrap">
                             Nível {event.intensity}
                           </span>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* FAB */}
      <button onClick={() => navigate('/log-event')} className="fab">
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};

export default FamilyHome;
