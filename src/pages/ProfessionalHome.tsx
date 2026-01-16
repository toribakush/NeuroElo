          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                          <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                                                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                                                Análise de Comportamento
                                            </CardTitle>CardTitle>
                                            <div className="flex gap-1">
                                              {['daily', 'weekly', 'monthly'].map((range) => (
                                  <button
                                                            key={range}
                                                            onClick={() => setTimeRange(range as any)}
                                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                                                        timeRange === range 
                                                                                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                                                                          : 'text-slate-500 hover:bg-slate-100'
                                                            }`}
                                                          >
                                    {range === 'daily' ? 'Dia' : range === 'weekly' ? 'Semana' : 'Mês'}
                                  </button>button>
                                ))}
                                            </div>div>
                                          </CardHeader>import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, MapPin, BarChart3, Pill, Plus, Trash2, Save } from 'lucide-react';
import { format, startOfWeek, subWeeks, subMonths, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { medicationSchema } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { MedicationList } from '@/components/MedicationList';

const MOOD_COLORS = {
  bom_dia: '#22c55e',
  ansiedade: '#f97316',
  crise: '#ef4444',
  meltdown: '#a855f7',
  default: '#1e293b'
};

const PatientDashboard = () => {
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
  const [timeRange, setTimeRange] = useState('daily');

  useEffect(() => {
    if (patientId) fetchAllData();
  }, [patientId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
      if (profile) setPatientName(profile.full_name || "Paciente");
      const { data: dailyLogs } = await supabase.from('daily_logs').select('*').eq('user_id', patientId).order('date', { ascending: true });
      if (dailyLogs) {
        setLogs(dailyLogs);
        processStaticCharts(dailyLogs);
      }
      const { data: medications } = await supabase.from('medications').select('*').eq('user_id', patientId).order('created_at', { ascending: false });
      if (medications) setMeds(medications);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processStaticCharts = (data) => {
    const triggers = {};
    data.forEach(log => {
      if (log.triggers) {
        log.triggers.forEach((t) => {
          triggers[t] = (triggers[t] || 0) + 1;
        });
      }
    });
    setTriggerStats(Object.entries(triggers).map(([name, value]) => ({ name: TRIGGER_LABELS[name] || name, value })));
    const locations = {};
    data.forEach(log => {
      if (log.location_name) {
        locations[log.location_name] = (locations[log.location_name] || 0) + 1;
      }
    });
    setLocationStats(Object.entries(locations).map(([name, value]) => ({ name, value })));
  };

  const handleAddMedication = async () => {
    if (!newMedName || !newMedDose || !newMedTime) {
      toast({ title: "Erro", description: "Preencha todos os campos do medicamento.", variant: "destructive" });
      return;
    }
    try {
      setIsSavingMed(true);
      const { error } = await supabase.from('medications').insert({
        user_id: patientId,
        name: newMedName,
        dosage: newMedDose,
        frequency: newMedTime,
        next_dose: newMedTime,
        stock: 30
      });
      if (error) throw error;
      toast({ title: "Sucesso", description: "Medicamento adicionado com sucesso!" });
      setNewMedName('');
      setNewMedDose('');
      setNewMedTime('');
      fetchAllData();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar o medicamento.", variant: "destructive" });
    } finally {
      setIsSavingMed(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600 font-medium">Carregando prontuário digital...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{patientName}</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Prontuário Digital • ID: {patientId?.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
              MODO PROFISSIONAL
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Análise de Comportamento
                  </CardTitle>
                  <div className="flex gap-1">
                    {['daily', 'weekly', 'monthly'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${timeRange === range ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        {range === 'daily' ? 'Dia' : range === 'weekly' ? 'Semana' : 'Mês'}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  {logs.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={logs}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'dd/MM', { locale: ptBR })} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelFormatter={(label) => format(new Date(label), 'PPPP', { locale: ptBR })} />
                        <Line type="monotone" dataKey="mood_score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <BarChart3 className="w-12 h-12 opacity-20" />
                      <p className="text-sm italic">Sem dados suficientes para gerar o gráfico.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader><CardTitle className="text-lg font-semibold text-slate-800">Gatilhos Identificados</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    {triggerStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={triggerStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {triggerStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'][index % 4]} />))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (<div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Nenhum gatilho registrado.</div>)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardHeader><CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-rose-500" />Locais Frequentes</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {locationStats.length > 0 ? (locationStats.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 font-medium">{loc.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${(loc.value / logs.length) * 100}%` }} /></div>
                          <span className="text-xs font-bold text-slate-400">{loc.value}x</span>
                        </div>
                      </div>
                    ))) : (<div className="py-8 text-center text-slate-400 text-sm italic">Sem dados de localização.</div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-8">
            <MedicationList medications={meds} />
            <Card className="border-none shadow-sm bg-indigo-900 text-white overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-lg font-semibold flex items-center gap-2"><Plus className="w-5 h-5" />Prescrever Novo</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Nome do Medicamento</label>
                  <Input value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="Ex: Ritalina" className="bg-white/10 border-white/20 text-white placeholder:text-indigo-300/50 focus:bg-white/20 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Dosagem</label>
                    <Input value={newMedDose} onChange={(e) => setNewMedDose(e.target.value)} placeholder="10mg" className="bg-white/10 border-white/20 text-white placeholder:text-indigo-300/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Horário</label>
                    <Input value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} type="time" className="bg-white/10 border-white/20 text-white" />
                  </div>
                </div>
                <Button onClick={handleAddMedication} disabled={isSavingMed} className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold py-6 rounded-xl shadow-lg shadow-indigo-950/50 transition-all active:scale-95">
                  {isSavingMed ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Prescrição'}
                </Button>
              </CardContent>
            </Card>
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm"><Info className="w-4 h-4" />Nota Importante</div>
              <p className="text-xs text-amber-700 leading-relaxed">Este prontuário é confidencial. Todas as alterações feitas aqui são registradas e notificadas aos responsáveis legais do paciente em tempo real.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
