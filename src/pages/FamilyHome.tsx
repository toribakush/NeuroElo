import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Calendar, TrendingUp, LogOut, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateMockEvents } from '@/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types';

const FamilyHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const events = generateMockEvents(user?.id || '');
  const crisisEvents = events.filter(e => e.type === 'crise');
  const lastCrisis = crisisEvents[0];
  const daysWithoutCrisis = lastCrisis 
    ? Math.floor((Date.now() - lastCrisis.dateTime.getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  
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
              Olá, {user?.name?.split(' ')[0]}
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
              <p className="text-5xl font-bold mt-1">{daysWithoutCrisis}</p>
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
            {recentEvents.map((event) => (
              <div key={event.id} className="card-elevated p-4">
                <div className="flex items-center gap-3">
                  <div className={`status-dot ${EVENT_TYPE_COLORS[event.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{EVENT_TYPE_LABELS[event.type]}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(event.dateTime, 'dd/MM HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{event.notes}</p>
                  </div>
                </div>
              </div>
            ))}
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
