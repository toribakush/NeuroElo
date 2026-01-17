import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  LogOut, 
  Search,
  Calendar,
  Clock,
  X,
  ChevronRight,
  CalendarPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  full_name: string | null;
  email: string | null;
  connected_at: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  title: string;
  duration_minutes: number;
  status: string;
  patient_id: string;
  patient_name?: string;
}

const ProfessionalHome = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionCode, setConnectionCode] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Scheduling state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('Consulta');
  const [scheduleDuration, setScheduleDuration] = useState('60');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch connected patients
      const { data: connections } = await supabase
        .from('patient_connections')
        .select('patient_id, created_at')
        .eq('professional_id', user.id);

      if (connections && connections.length > 0) {
        const patientIds = connections.map(c => c.patient_id);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', patientIds);

        const patientsWithDates = profiles?.map(p => ({
          ...p,
          connected_at: connections.find(c => c.patient_id === p.id)?.created_at || ''
        })) || [];

        setPatients(patientsWithDates);

        // Fetch appointments for connected patients
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('*')
          .eq('professional_id', user.id)
          .order('scheduled_at', { ascending: true });

        // Add patient names to appointments
        const appointmentsWithNames = (appointmentsData as Appointment[] || []).map(apt => ({
          ...apt,
          patient_name: profiles?.find(p => p.id === apt.patient_id)?.full_name || 'Paciente'
        }));

        setAppointments(appointmentsWithNames);
      } else {
        setPatients([]);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async () => {
    if (!user || !connectionCode.trim()) return;
    setAddingPatient(true);

    try {
      // Validate the connection code
      const { data: patientId, error: validateError } = await supabase
        .rpc('validate_connection_code', { _code: connectionCode.trim().toUpperCase() });

      if (validateError || !patientId) {
        toast({ 
          title: 'Código inválido', 
          description: 'Verifique o código e tente novamente.', 
          variant: 'destructive' 
        });
        return;
      }

      // Create connection
      const { error: connectError } = await supabase
        .from('patient_connections')
        .insert({
          professional_id: user.id,
          patient_id: patientId,
          connection_code: connectionCode.trim().toUpperCase()
        });

      if (connectError) {
        if (connectError.code === '23505') {
          toast({ 
            title: 'Já conectado', 
            description: 'Este paciente já está na sua lista.', 
            variant: 'destructive' 
          });
        } else {
          throw connectError;
        }
        return;
      }

      toast({ title: 'Paciente conectado!', description: 'Agora você pode ver os registros.' });
      setConnectionCode('');
      loadData();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível adicionar o paciente.', 
        variant: 'destructive' 
      });
    } finally {
      setAddingPatient(false);
    }
  };

  const createAppointment = async () => {
    if (!user || !selectedPatientId || !scheduleDate || !scheduleTime) return;
    setScheduling(true);

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

      const { error } = await supabase
        .from('appointments')
        .insert({
          professional_id: user.id,
          patient_id: selectedPatientId,
          scheduled_at: scheduledAt,
          title: scheduleTitle || 'Consulta',
          duration_minutes: parseInt(scheduleDuration) || 60,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({ title: 'Agendamento criado!', description: 'O paciente será notificado.' });
      setShowScheduleDialog(false);
      resetScheduleForm();
      loadData();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível criar o agendamento.', 
        variant: 'destructive' 
      });
    } finally {
      setScheduling(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({ title: 'Agendamento cancelado' });
      loadData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível cancelar.', 
        variant: 'destructive' 
      });
    }
  };

  const resetScheduleForm = () => {
    setSelectedPatientId('');
    setScheduleDate('');
    setScheduleTime('');
    setScheduleTitle('Consulta');
    setScheduleDuration('60');
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingAppointments = appointments.filter(
    a => a.status === 'scheduled' && new Date(a.scheduled_at) > new Date()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-white">Olá, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-sm text-slate-400">Painel Profissional</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Add Patient */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código de conexão"
                value={connectionCode}
                onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 font-mono tracking-wider"
              />
              <Button 
                onClick={addPatient} 
                disabled={addingPatient || !connectionCode.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {addingPatient ? 'Conectando...' : 'Conectar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Próximos Agendamentos ({upcomingAppointments.length})
            </CardTitle>
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Agendar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-slate-300">Paciente</Label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full mt-1 bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="">Selecione um paciente</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Título</Label>
                    <Input
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Data</Label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Horário</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Duração (minutos)</Label>
                    <select
                      value={scheduleDuration}
                      onChange={(e) => setScheduleDuration(e.target.value)}
                      className="w-full mt-1 bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="90">1h 30min</option>
                      <option value="120">2 horas</option>
                    </select>
                  </div>
                  <Button 
                    onClick={createAppointment}
                    disabled={scheduling || !selectedPatientId || !scheduleDate || !scheduleTime}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {scheduling ? 'Criando...' : 'Criar Agendamento'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{apt.title}</p>
                      <p className="text-sm text-slate-400">
                        {apt.patient_name} • {format(new Date(apt.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => cancelAppointment(apt.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Nenhum agendamento próximo
              </p>
            )}
          </CardContent>
        </Card>

        {/* Patient List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Meus Pacientes ({patients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patients.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            )}
            
            {filteredPatients.length > 0 ? (
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    onClick={() => navigate(`/patient/${patient.id}`)}
                    className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      {patient.full_name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{patient.full_name || 'Paciente'}</p>
                      <p className="text-xs text-slate-400">{patient.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                {patients.length === 0 
                  ? 'Nenhum paciente conectado ainda.' 
                  : 'Nenhum paciente encontrado.'}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfessionalHome;
