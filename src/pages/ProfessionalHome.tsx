import React, { useEffect, useState, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOOD_COLORS = {
  bom_dia: '#22c55e',
  ansiedade: '#f97316',
  crise: '#ef4444',
  meltdown: '#a855f7',
  default: '#1e293b'
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
  const [timeRange, setTimeRange] = useState('daily');

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

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!newMedName || !newMedDose || !newMedTime) return;
    try {
      setIsSavingMed(true);
      const { data, error } = await supabase.from('medications').insert([{ patient_id: patientId, name: newMedName, dosage: newMedDose, frequency: newMedTime, stock: 0 }]).select();
      if (error) throw error;
      setMeds([...meds, data[0]]);
      setNewMedName(''); setNewMedDose(''); setNewMedTime('');
      toast({ title: "Sucesso", description: "Medicamento adicionado com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o medicamento." });
    } finally {
      setIsSavingMed(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (error) throw error;
      setMeds(meds.filter(m => m.id !== id));
      toast({ title: "Removido", description: "Medicamento removido com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o medicamento." });
    }
  };

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate = startOfWeek(now, { weekStartsOn: 0 });
    if (timeRange === 'monthly') startDate = subMonths(now, 1);
    const days = [];
    let current = startDate;
    while (current <= now) {
      const dayLogs = logs.filter(log => isSameDay(new Date(log.created_at), current));
      days.push({ date: format(current, 'dd/MM'), count: dayLogs.length });
      current = new Date(current.setDate(current.getDate() + 1));
    }
    return days;
  }, [logs, timeRange]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
            <div><h1 className="text-xl font-bold text-slate-900">{patientName}</h1><p className="text-xs text-slate-500 font-medium">Prontuário Digital • ID: {patientId?.slice(0,8)}</p></div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800"><BarChart3 className="w-5 h-5 text-indigo-600" />Análise de Comportamento</CardTitle>
                  <div className="flex gap-1">
                    {['daily', 'weekly', 'monthly'].map((range) => (
                      <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${timeRange === range ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                        {range === 'daily' ? 'Dia' : range === 'weekly' ? 'Semana' : 'Mês'}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Gatilhos Frequentes</CardTitle></CardHeader>
                <CardContent>
                  {triggerStats.length > 0 ? (
                    <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={triggerStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"><Cell fill="#4f46e5" /><Cell fill="#818cf8" /><Cell fill="#c7d2fe" /><Cell fill="#e0e7ff" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
                  ) : <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic">Sem dados de gatilhos</div>}
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Locais de Ocorrência</CardTitle></CardHeader>
                <CardContent>
                  {locationStats.length > 0 ? (
                    <div className="space-y-3">{locationStats.map((stat, i) => (<div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-700">{stat.name}</span></div><span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-600">{stat.value}</span></div>))}</div>
                  ) : <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic">Sem dados de localização</div>}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-8">
            <MedicationList medications={meds} onDelete={handleDeleteMedication} />
            <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Pill className="w-24 h-24 rotate-12" /></div>
              <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><Plus className="w-5 h-5" />Novo Medicamento</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddMedication} className="space-y-4">
                  <Input placeholder="Nome do remédio" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Dosagem" value={newMedDose} onChange={(e) => setNewMedDose(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" />
                    <Input placeholder="Horário" value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" />
                  </div>
                  <Button type="submit" disabled={isSavingMed} className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold">{isSavingMed ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalHome;
