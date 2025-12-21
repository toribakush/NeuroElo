import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, MapPin, BarChart3, Pill, Plus, Trash2, Save } from 'lucide-react';
import { format, startOfWeek, subWeeks, subMonths, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';

// Cores para os eventos no gráfico
const MOOD_COLORS: Record<string, string> = {
  bom_dia: '#22c55e',
  ansiedade: '#f97316',
  crise: '#ef4444',
  meltdown: '#a855f7',
  default: '#1e293b'
};

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  
  // Estados para gerenciar a adição de medicamentos
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('');
  const [isSavingMed, setIsSavingMed] = useState(false);

  const [triggerStats, setTriggerStats] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<string[][][]>([]); 
  const [locationStats, setLocationStats] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

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
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const processStaticCharts = (data: any[]) => {
    // Mapa de Calor
    const matrix: string[][][] = Array(7).fill(0).map(() => Array(24).fill(0).map(() => []));
    data.forEach(log => {
      const d = new Date(log.date);
      matrix[d.getDay()][d.getHours()].push(log.mood);
    });
    setHeatmapData(matrix);

    // Gatilhos
    const triggerCounts: Record<string, number> = {};
    let totalTriggers = 0;
    data.forEach(log => {
      if (log.triggers) {
        log.triggers.forEach((t: string) => {
          triggerCounts[t] = (triggerCounts[t] || 0) + 1;
          totalTriggers++;
        });
      }
    });
    setTriggerStats(Object.entries(triggerCounts).map(([key, value]) => ({ trigger: key, count: value, percentage: Math.round((value / totalTriggers) * 100) })).sort((a, b) => b.count - a.count));

    // Locais de Crise
    const locationCounts: Record<string, number> = {};
    let totalCrises = 0;
    data.forEach(log => {
      if (log.mood === 'crise' && log.location) {
        locationCounts[log.location] = (locationCounts[log.location] || 0) + 1;
        totalCrises++;
      }
    });
    setLocationStats(Object.entries(locationCounts).map(([loc, count]) => ({ location: loc, count, percentage: totalCrises > 0 ? Math.round((count / totalCrises) * 100) : 0 })).sort((a, b) => b.count - a.count).slice(0, 5));
  };

  const handleAddMed = async () => {
    if (!newMedName) return;
    setIsSavingMed(true);
    try {
      const { error } = await supabase.from('medications').insert({
        user_id: patientId,
        name: newMedName,
        dosage: newMedDose,
        time: newMedTime
      });
      if (error) throw error;
      setNewMedName(''); setNewMedDose(''); setNewMedTime('');
      fetchAllData();
    } catch (e) {
      console.error("Erro ao salvar med:", e);
    } finally {
      setIsSavingMed(false);
    }
  };

  const handleDeleteMed = async (id: string) => {
    if (!confirm("Remover este medicamento?")) return;
    await supabase.from('medications').delete().eq('id', id);
    fetchAllData();
  };

  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    const now = new Date();
    let filtered = logs;
    if (timeRange === 'daily') filtered = logs.filter(l => isSameDay(new Date(l.date), now));
    
    return filtered.map(log => ({ 
      label: format(new Date(log.date), 'HH:mm'), 
      intensity: log.intensity, 
      mood: log.mood 
    }));
  }, [logs, timeRange]);

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    const fill = MOOD_COLORS[payload.mood] || MOOD_COLORS.default;
    return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={1} />;
  };

  const getHeatmapColor = (moods: string[]) => {
    if (moods.length === 0) return '#f3f4f6';
    if (moods.includes('crise')) return MOOD_COLORS.crise;
    if (moods.includes('meltdown')) return MOOD_COLORS.meltdown;
    if (moods.includes('ansiedade')) return MOOD_COLORS.ansiedade;
    if (moods.includes('bom_dia')) return MOOD_COLORS.bom_dia;
    return MOOD_COLORS.default;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="p-6 bg-white border-b">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold mt-4 text-slate-900 capitalize">{patientName}</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 space-y-8 mt-8">
        
        {/* Mapa de Calor */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 overflow-hidden">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" /> Horários de Crise
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[600px] space-y-1">
              {heatmapData.map((dayData, dayIndex) => (
                <div key={dayIndex} className="flex items-center h-6 gap-1">
                  <div className="w-10 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{DAYS_OF_WEEK[dayIndex]}</div>
                  {dayData.map((moods, hourIndex) => (
                    <div 
                      key={hourIndex} 
                      className="flex-1 h-full rounded-sm" 
                      style={{ backgroundColor: getHeatmapColor(moods) }}
                      title={`${moods.length} eventos`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico de Intensidade */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
             <BarChart3 className="w-4 h-4 text-blue-500" /> Evolução Diária (Hoje)
           </h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Line type="monotone" dataKey="intensity" stroke="url(#colorIntensity)" strokeWidth={3} dot={<CustomizedDot />} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Medicamentos */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6 text-purple-600">
            <Pill className="w-5 h-5" />
            <h3 className="font-bold">Medicamentos e Dosagens</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-8 bg-purple-50 p-4 rounded-xl border border-purple-100">
            <input placeholder="Medicamento" className="flex-1 h-10 px-3 rounded-lg border bg-white text-sm" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
            <input placeholder="Dosagem" className="flex-1 h-10 px-3 rounded-lg border bg-white text-sm" value={newMedDose} onChange={e => setNewMedDose(e.target.value)} />
            <div className="flex gap-2 flex-1">
              <input placeholder="Horário" className="flex-1 h-10 px-3 rounded-lg border bg-white text-sm" value={newMedTime} onChange={e => setNewMedTime(e.target.value)} />
              <button onClick={handleAddMed} disabled={isSavingMed} className="h-10 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center">
                {isSavingMed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {meds.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-4 border rounded-xl bg-white group hover:border-purple-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                    <p className="text-xs text-slate-500">{med.dosage} • {med.time}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteMed(med.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
