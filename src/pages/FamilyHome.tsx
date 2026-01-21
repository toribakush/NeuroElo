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
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      // Fetch daily logs
      const { data: logsData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      // Fetch medications
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id);

      // Fetch upcoming appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      // Fetch connection code
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
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist - trigger will auto-generate code
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.name
          });

        if (insertError) throw insertError;
      } else {
        // Profile exists, update to trigger new code generation
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      // Refetch to get the new code
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Olá, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-sm text-slate-500">Como você está hoje?</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5 text-slate-400" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => navigate('/log-event')}
            className="h-20 bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex flex-col gap-2"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Novo Registro</span>
          </Button>
          <Button 
            onClick={() => navigate('/medications')}
            variant="outline"
            className="h-20 rounded-2xl flex flex-col gap-2 border-slate-200"
          >
            <Pill className="w-6 h-6 text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Medicações</span>
          </Button>
        </div>

        {/* Connection Code */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Código de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionCode ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-xl px-4 py-3 font-mono text-lg tracking-widest text-center">
                  {connectionCode}
                </div>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={generateConnectionCode}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={generateConnectionCode} className="w-full">
                Gerar Código de Conexão
              </Button>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Compartilhe este código com seu profissional para conectar.
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{apt.title}</p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(apt.scheduled_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      apt.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {apt.status === 'scheduled' ? 'Agendado' : 
                       apt.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum agendamento próximo
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Registros Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 capitalize">
                        {log.mood || 'Registro'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {log.date ? format(new Date(log.date), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
                    {log.intensity && (
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                        Intensidade: {log.intensity}/10
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum registro ainda. Comece agora!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Minhas Medicações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length > 0 ? (
              <div className="space-y-2">
                {medications.map((med) => (
                  <div 
                    key={med.id} 
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage}</p>
                    </div>
                    {med.time && (
                      <span className="text-sm text-slate-500 flex items-center gap-1">
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
                className="w-full"
                onClick={() => navigate('/medications')}
              >
                Adicionar Medicação
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FamilyHome;
