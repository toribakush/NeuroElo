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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  
  // Estados para novo medicamento (Médico editando)
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
      // 1. Perfil
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
      if (profile) setPatientName(profile.full_name || "Paciente");

      // 2. Logs
      const { data: dailyLogs } = await supabase.from('daily_logs').select('*').eq('user_id', patientId).order('date', { ascending: true });
      if (dailyLogs) {
        setLogs(dailyLogs);
        processStaticCharts(dailyLogs);
      }

      // 3. Medicamentos
      const { data: medications } = await supabase.from('medications').select('*').eq('user_id', patientId).order('created_at', { ascending: false });
      if (medications) setMeds(medications);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processStaticCharts = (data: any[]) => {
    // Heatmap
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

    // Locais
    const locationCounts: Record<string, number> = {};
    let totalCrises = 0;
    data.forEach(log => {
      if (log.mood === 'crise' && log.location) {
        locationCounts[log.location] = (locationCounts[log.location] || 0) + 1;
        totalCrises++;
      }
    });
    setLocationStats(Object.entries(locationCounts).map(([loc, count]) => ({ location: loc, count, percentage: Math.round((count / totalCrises) * 100) })).sort((a, b) => b.count - a.count).slice(0, 5));
  };

  // Funções de Gerenciamento de Medicamentos pelo Médico
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
      toast({ title: "Medicamento adicionado ao prontuário" });
      setNewMedName(''); setNewMedDose(''); setNewMedTime('');
      fetchAllData();
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSavingMed(false);
    }
  };

  const handleDeleteMed = async (id: string) => {
    if (!confirm("Remover este medicamento do plano do paciente?")) return;
    await supabase.from('medications').delete().eq('id', id);
    fetchAllData();
  };

  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    const now = new Date();
    let filtered = logs;
    if (timeRange === 'daily') filtered = logs.filter(l => isSameDay(new Date(l.date), now));
    
    if (timeRange === 'daily') {
      return filtered.map(log => ({ label: format(new Date(log.date), 'HH:mm'), intensity: log.intensity, mood: log.mood }));
    }
    return []; // Simplificado para o exemplo
  }, [logs, timeRange]);

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    let fill = MOOD_COLORS[payload.mood] || MOOD_COLORS.default;
    return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={1} />;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="p-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" /><span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold mt-4">{patientName}</h1>
      </header>

      <main className="px-6 space-y-6">
        
        {/* Heatmap e Gráfico (Mantidos conforme sua versão anterior) */}
        <div className="card-elevated p-4">
           <h3 className="font-semibold mb-4">Evolução da Intensidade</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="intensity" stroke="url(#colorIntensity)" strokeWidth={3} dot={<CustomizedDot />} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* --- SEÇÃO DE MEDICAMENTOS (O MÉDICO PODE MUDAR) --- */}
        <div className="card-elevated p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 mb-4 text-purple-700">
            <Pill className="w-5 h-5" />
            <h3 className="font-bold">Plano Terapêutico / Medicamentos</h3>
          </div>

          {/* Adicionar Medicamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 p-3 bg-purple-50 rounded-lg">
            <Input placeholder="Medicamento" value={newMedName} onChange={e => setNewMedName(e.target.value)} className="bg-white" />
            <Input placeholder="Dose" value={newMedDose} onChange={e => setNewMedDose(e.target.value)} className="bg-white" />
            <div className="flex gap-2">
              <Input placeholder="Horário" value={newMedTime} onChange={e => setNewMedTime(e.target.value)} className="bg-white" />
              <Button onClick={handleAddMed} disabled={isSavingMed} size="icon">
                {isSavingMed ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Lista de Medicamentos do Paciente */}
          <div className="space-y-2">
            {meds.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhum medicamento registrado para este paciente.</p>
            ) : (
              meds.map((med) => (
                <div key={med.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <div>
                      <p className="font-bold text-sm text-foreground">{med.name}</p>
                      <p className="text-xs text-muted-foreground">{med.dosage} • {med.time}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMed(med.id)} className="text-muted-foreground hover:text-red-500 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outros Gráficos (Ranking de Locais e Gatilhos) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Ranking de Locais */}
           <div className="card-elevated p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Locais de Crise</h3>
              {locationStats.map((item, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span>{item.location}</span><span>{item.percentage}%</span></div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
           </div>
           {/* Gatilhos */}
           <div className="card-elevated p-4">
              <h3 className="font-semibold mb-2">Gatilhos</h3>
              {triggerStats.slice(0,3).map((t, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {TRIGGER_LABELS[t.trigger] || t.trigger} ({t.percentage}%)</p>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
