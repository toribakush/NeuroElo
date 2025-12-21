import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // <--- Importante para atualização automática
import { Plus, Calendar, TrendingUp, LogOut, Copy, Check, Loader2 } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  // --- BUSCA REAL NO BANCO DE DADOS ---
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['daily_logs'], // Essa chave conecta com o 'invalidateQueries' do LogEvent
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }); // Ordena do mais recente para o mais antigo

      if (error) {
        console.error('Erro ao buscar logs:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user?.id, // Só busca se tiver usuário logado
  });
  // -------------------------------------

  // Cálculos baseados nos dados reais
  const crisisEvents = events.filter((e: any) => e.mood === 'crise');
  const lastCrisis = crisisEvents[0];
  
  const daysWithoutCrisis = lastCrisis 
    ? Math.floor((Date.now() - new Date(lastCrisis.date).getTime()) / (1000 * 60 * 60 * 24))
    : 0; // Se nunca teve crise, ou mostra 0 ou um número alto, decida a regra. Coloquei 0 para novos usuários.

  const recentEvents = events.slice(0, 5);

  const handleCopyCode = () => {
    if (user?.connectionCode) {
      navigator.clipboard.writeText(user.connectionCode);
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

        {/* Connection Code */}
        {user?.connectionCode && (
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Código de conexão</p>
                <p className="text-xl font-mono font-bold text-foreground mt-1">{user.connectionCode}</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Compartilhe com seu profissional</p>
          </div>
        )}

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
              <p className="text-center text-muted-foreground py-4">Nenhum registro ainda.</p>
            ) : (
              recentEvents.map((event: any) => (
                <div key={event.id} className="card-elevated p-4">
                  <div className="flex items-start gap-3">
                    {/* Nota: Usando 'mood' em vez de 'type' conforme o banco */}
                    <div className={`status-dot mt-1.5 ${EVENT_TYPE_COLORS[event.mood as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">
                          {EVENT_TYPE_LABELS[event.mood as keyof typeof EVENT_TYPE_LABELS] || event.mood}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {/* Nota: Usando 'date' em vez de 'dateTime' */}
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
