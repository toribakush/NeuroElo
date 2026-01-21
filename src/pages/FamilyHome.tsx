import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Plus, 
  Pill, 
  LogOut, 
  Copy, 
  RefreshCw, 
  Clock,
  CalendarDays,
  Link2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyLog {
  id: string;
  mood: string | null;
  intensity: number | null;
  date: string | null;
  notes: string | null;
}

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  time: string | null;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  title: string;
  duration_minutes: number;
  status: string;
  professional_id: string;
}

const FamilyHome = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: logsData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id);

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      const { data: profile } = await supabase
        .from('profiles')
        .select('connection_code')
        .eq('id', user.id)
        .single();

      setLogs(logsData || []);
      setMedications(medsData || []);
      setAppointments((appointmentsData as Appointment[]) || []);
      setConnectionCode(profile?.connection_code || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateConnectionCode = async () => {
    if (!user) return;

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.name
          });

        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      const { data } = await supabase
        .from('profiles')
        .select('connection_code')
        .eq('id', user.id)
        .maybeSingle();

      setConnectionCode(data?.connection_code || null);
      toast({ title: 'Código gerado!', description: 'Compartilhe com seu profissional.' });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível gerar o código.', 
        variant: 'destructive' 
      });
    }
  };

  const copyCode = () => {
    if (connectionCode) {
      navigator.clipboard.writeText(connectionCode);
      toast({ title: 'Código copiado!', description: 'Cole para compartilhar.' });
    }
  };

  const getMoodEmoji = (mood: string | null) => {
    const moods: Record<string, string> = {
      happy: '😊',
      calm: '😌',
      anxious: '😰',
      sad: '😢',
      angry: '😠',
      neutral: '😐'
    };
    return moods[mood || ''] || '📝';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pb-8">
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Como você está hoje?
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 space-y-5">
        {/* Quick Actions - Colorful Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/log-event')}
            className="card-yellow h-28 rounded-3xl p-4 flex flex-col justify-between text-left shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
          >
            <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Novo Registro</span>
          </button>
          <button 
            onClick={() => navigate('/medications')}
            className="card-pink h-28 rounded-3xl p-4 flex flex-col justify-between text-left shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
          >
            <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Medicações</span>
          </button>
        </div>

        {/* Connection Code */}
        <div className="glass-card rounded-3xl p-5 animate-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 card-teal rounded-lg flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-foreground">Código de Conexão</h3>
          </div>
          
          {connectionCode ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-2xl px-4 py-3 font-mono text-xl tracking-[0.3em] text-center font-bold text-primary">
                {connectionCode}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyCode}
                className="rounded-xl h-12 w-12 border-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={generateConnectionCode}
                className="rounded-xl h-12 w-12 border-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={generateConnectionCode} 
              className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/90"
            >
              Gerar Código de Conexão
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Compartilhe este código com seu profissional
          </p>
        </div>

        {/* Upcoming Appointments */}
        <div className="glass-card rounded-3xl p-5 animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 card-purple rounded-lg flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-foreground">Próximos Agendamentos</h3>
          </div>
          
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 3).map((apt, index) => {
                const colors = ['card-teal', 'card-pink', 'card-yellow'];
                return (
                  <div 
                    key={apt.id} 
                    className={`${colors[index % 3]} rounded-2xl p-4 text-white`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{apt.title}</p>
                        <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(apt.scheduled_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                        {apt.status === 'scheduled' ? 'Agendado' : 
                         apt.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum agendamento próximo
            </p>
          )}
        </div>

        {/* Recent Logs */}
        <div className="glass-card rounded-3xl p-5 animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 card-yellow rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-foreground">Registros Recentes</h3>
          </div>
          
          {logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center gap-3 p-3 bg-muted rounded-2xl"
                >
                  <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {log.mood || 'Registro'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.date ? format(new Date(log.date), 'dd/MM/yyyy') : '-'}
                    </p>
                  </div>
                  {log.intensity && (
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {log.intensity}/10
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum registro ainda. Comece agora!
            </p>
          )}
        </div>

        {/* Medications */}
        <div className="glass-card rounded-3xl p-5 animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 card-pink rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-foreground">Minhas Medicações</h3>
          </div>
          
          {medications.length > 0 ? (
            <div className="space-y-2">
              {medications.map((med) => (
                <div 
                  key={med.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-2xl"
                >
                  <div>
                    <p className="font-medium text-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage}</p>
                  </div>
                  {med.time && (
                    <span className="text-sm text-primary font-medium flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {med.time}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full rounded-2xl h-12 border-2 border-dashed"
              onClick={() => navigate('/medications')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Medicação
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default FamilyHome;
