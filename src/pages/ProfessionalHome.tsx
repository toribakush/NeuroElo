import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, MapPin, BarChart3, Pill, Plus, Trash2, Save, Calendar, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MedicationList } from '@/components/MedicationList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOOD_COLORS = {
  bom_dia: '#10b981',
  ansiedade: '#f59e0b',
  crise: '#ef4444',
  meltdown: '#8b5cf6',
  default: '#64748b'
};

const ProfessionalHome = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState([]);
  const [meds, setMeds] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('');
  const [isSavingMed, setIsSavingMed] = useState(false);
  const [triggerStats, setTriggerStats] = useState([]);
  const [locationStats, setLocationStats] = useState([]);

  useEffect(() => {
    if (patientId) fetchAllData();
  }, [patientId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
      if (profile) setPatientName(profile.full_name);

      const { data: logsData } = await supabase.from('event_logs').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
      setLogs(logsData || []);

      const { data: medsData } = await supabase.from('medications').select('*').eq('patient_id', patientId).order('name');
      setMeds(medsData || []);

      processStats(logsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível carregar as informações do paciente." });
    } finally {
      setLoading(false);
    }
  };

  const processStats = (data) => {
    const triggers = {};
    const locations = {};
    data.forEach(log => {
      if (log.trigger) triggers[log.trigger] = (triggers[log.trigger] || 0) + 1;
      if (log.location_name) locations[log.location_name] = (locations[log.location_name] || 0) + 1;
    });

    setTriggerStats(Object.entries(triggers).map(([name, value]) => ({ name: TRIGGER_LABELS[name] || name, value })));
    setLocationStats(Object.entries(locations).map(([name, value]) => ({ name, value })));
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedDose || !newMedTime) return;

    try {
      setIsSavingMed(true);
      const { error } = await supabase.from('medications').insert([{
        patient_id: patientId,
        name: newMedName,
        dosage: newMedDose,
        frequency: newMedTime,
        next_dose: newMedTime,
        stock: 30
      }]);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Medicamento adicionado com sucesso." });
      setNewMedName('');
      setNewMedDose('');
      setNewMedTime('');
      fetchAllData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível adicionar o medicamento." });
    } finally {
      setIsSavingMed(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-500 font-medium">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header Moderno */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                {patientName}
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Prontuário Digital • NeuroElo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
              <Activity className="w-3 h-3" />
              Monitoramento Ativo
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Coluna Esquerda: Insights e Gráficos */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Últimos 30 dias</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{logs.length}</h3>
                  <p className="text-sm text-slate-500">Eventos registrados</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Status</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Estável</h3>
                  <p className="text-sm text-slate-500">Tendência comportamental</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Pill className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Medicação</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{meds.length}</h3>
                  <p className="text-sm text-slate-500">Remédios ativos</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Tendência */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Análise de Comportamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={logs.slice(0, 10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="created_at" 
                        tickFormatter={(str) => format(new Date(str), 'dd/MM')}
                        axisLine={false}
                        tickLine={false}
                        tick={{fill: '#94a3b8', fontSize: 12}}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        labelFormatter={(str) => format(new Date(str), 'PPP', { locale: ptBR })}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="id" 
                        stroke="#4f46e5" 
                        strokeWidth={3} 
                        dot={{fill: '#4f46e5', strokeWidth: 2, r: 4}}
                        activeDot={{r: 6, strokeWidth: 0}}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Eventos */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-1">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Linha do Tempo
              </h3>
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                    <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum evento registrado ainda.</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 hover:border-indigo-100 transition-colors group">
                      <div 
                        className="w-3 h-12 rounded-full shrink-0" 
                        style={{ backgroundColor: MOOD_COLORS[log.event_type] || MOOD_COLORS.default }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                            {format(new Date(log.created_at), "HH:mm '•' dd MMM", { locale: ptBR })}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                            <MapPin className="w-2 h-2" />
                            {log.location_name || 'Local não informado'}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900">{EVENT_TYPE_LABELS[log.event_type]}</h4>
                        {log.notes && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{log.notes}</p>}
                        {log.trigger && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold">
                            Gatilho: {TRIGGER_LABELS[log.trigger] || log.trigger}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Medicação e Ações */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Gestão de Medicamentos */}
            <div className="space-y-6">
              <MedicationList medications={meds} />
              
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    Novo Medicamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMedication} className="space-y-3">
                    <Input 
                      placeholder="Nome do remédio" 
                      value={newMedName} 
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="bg-slate-50 border-none rounded-xl focus-visible:ring-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="Dosagem" 
                        value={newMedDose} 
                        onChange={(e) => setNewMedDose(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl focus-visible:ring-indigo-500"
                      />
                      <Input 
                        type="time" 
                        value={newMedTime} 
                        onChange={(e) => setNewMedTime(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl focus-visible:ring-indigo-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSavingMed} 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                      {isSavingMed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvar Medicamento
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Rápidas */}
            <Card className="border-none shadow-sm bg-indigo-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BarChart3 className="w-24 h-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Resumo de Gatilhos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {triggerStats.length === 0 ? (
                    <p className="text-xs text-indigo-300 italic">Dados insuficientes para análise.</p>
                  ) : (
                    triggerStats.map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-indigo-100">{stat.name}</span>
                        <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">{stat.value}x</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalHome;
