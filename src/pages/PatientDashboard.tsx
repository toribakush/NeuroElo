import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, MapPin, BarChart3 } from 'lucide-react';
import { format, startOfWeek, subDays, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';

const COLORS = ['hsl(215, 45%, 20%)', 'hsl(158, 40%, 45%)', 'hsl(32, 75%, 55%)', 'hsl(12, 60%, 55%)', 'hsl(280, 45%, 55%)', 'hsl(210, 20%, 70%)'];
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  
  // Estados para gráficos estáticos
  const [triggerStats, setTriggerStats] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]); 
  const [maxCrisisCount, setMaxCrisisCount] = useState(0);
  const [locationStats, setLocationStats] = useState<any[]>([]);

  // Filtro de Tempo (Inicia como Diário)
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  useEffect(() => {
    if (patientId) fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', patientId).single();
      if (profile) setPatientName(profile.full_name || profile.email || "Paciente");

      const { data: dailyLogs, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', patientId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (dailyLogs) {
        setLogs(dailyLogs);
        processStaticCharts(dailyLogs);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const processStaticCharts = (data: any[]) => {
    // 1. Gatilhos
    const triggerCounts: Record<string, number> = {};
    let totalTriggers = 0;
    data.forEach(log => {
      if (log.triggers && Array.isArray(log.triggers)) {
        log.triggers.forEach((t: string) => {
          triggerCounts[t] = (triggerCounts[t] || 0) + 1;
          totalTriggers++;
        });
      }
    });
    setTriggerStats(Object.entries(triggerCounts)
      .map(([key, value]) => ({ trigger: key, count: value, percentage: Math.round((value / totalTriggers) * 100) }))
      .sort((a, b) => b.count - a.count));

    // 2. Heatmap
    const matrix = Array(7).fill(0).map(() => Array(24).fill(0));
    let maxCount = 0;
    data.forEach(log => {
      if (log.mood === 'crise') {
        const d = new Date(log.date);
        matrix[d.getDay()][d.getHours()]++;
        if (matrix[d.getDay()][d.getHours()] > maxCount) maxCount = matrix[d.getDay()][d.getHours()];
      }
    });
    setHeatmapData(matrix);
    setMaxCrisisCount(maxCount);

    // 3. Ranking de Locais
    const locationCounts: Record<string, number> = {};
    let totalCrisesWithLocation = 0;
    data.forEach(log => {
      if (log.mood === 'crise' && log.location) {
        const loc = log.location.trim(); 
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        totalCrisesWithLocation++;
      }
    });
    const locStats = Object.entries(locationCounts)
      .map(([loc, count]) => ({
        location: loc,
        count: count,
        percentage: totalCrisesWithLocation > 0 ? Math.round((count / totalCrisesWithLocation) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setLocationStats(locStats);
  };

  // --- LÓGICA DO GRÁFICO ---
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];

    const now = new Date();
    let filteredLogs = logs;
    let dateFormat = 'dd/MM';

    // 1. Aplica o filtro de data
    if (timeRange === 'daily') {
      // AGORA: Mostra apenas os últimos 7 dias
      const cutoff = subDays(now, 7); 
      filteredLogs = logs.filter(l => new Date(l.date) >= cutoff);
      dateFormat = 'dd/MM';
    } else if (timeRange === 'weekly') {
      const cutoff = subWeeks(now, 12);
      filteredLogs = logs.filter(l => new Date(l.date) >= cutoff);
      dateFormat = 'dd/MM'; 
    } else if (timeRange === 'monthly') {
      const cutoff = subMonths(now, 12);
      filteredLogs = logs.filter(l => new Date(l.date) >= cutoff);
      dateFormat = 'MMM';
    } else {
      dateFormat = 'yyyy';
    }

    // 2. Agrupa os dados
    const groups: Record<string, { sum: number; count: number; date: Date }> = {};

    filteredLogs.forEach(log => {
      const date = new Date(log.date);
      let key = '';

      if (timeRange === 'daily') {
        key = format(date, 'yyyy-MM-dd');
      } else if (timeRange === 'weekly') {
        const start = startOfWeek(date, { weekStartsOn: 0 });
        key = format(start, 'yyyy-MM-dd'); 
      } else if (timeRange === 'monthly') {
        key = format(date, 'yyyy-MM');
      } else {
        key = format(date, 'yyyy');
      }

      if (!groups[key]) {
        groups[key] = { sum: 0, count: 0, date: date };
      }
      groups[key].sum += (log.intensity || 0);
      groups[key].count += 1;
    });

    return Object.values(groups).map(group => ({
      label: format(group.date, dateFormat, { locale: ptBR }),
      intensity: Number((group.sum / group.count).toFixed(1)),
      rawDate: group.date
    })).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  }, [logs, timeRange]);


  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    const opacity = Math.max(0.3, Math.min(1, count / (maxCrisisCount || 1)));
    return `rgba(239, 68, 68, ${opacity})`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="p-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground mt-4">{patientName}</h1>
        <p className="text-muted-foreground">Painel Clínico</p>
      </header>

      <main className="px-6 space-y-6">
        
        {/* Heatmap */}
        <div className="card-elevated p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-foreground">Horários de Crise</h3>
            <div className="group relative">
               <Info className="w-4 h-4 text-muted-foreground cursor-help"/>
               <span className="absolute left-6 top-0 w-48 text-xs bg-black text-white p-2 rounded hidden group-hover:block z-10">
                 Mapa de calor de todas as crises registradas.
               </span>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              <div className="flex mb-1">
                <div className="w-10"></div>
                {HOURS.map(h => <div key={h} className="flex-1 text-[10px] text-center text-muted-foreground">{h}h</div>)}
              </div>
              {heatmapData.map((dayData, dayIndex) => (
                <div key={dayIndex} className="flex items-center mb-1 h-6">
                  <div className="w-10 text-[10px] font-medium text-muted-foreground">{DAYS_OF_WEEK[dayIndex]}</div>
                  {dayData.map((count, hourIndex) => (
                    <div 
                      key={hourIndex} 
                      className="flex-1 h-full mx-[1px] rounded-sm transition-all relative group"
                      style={{ backgroundColor: count > 0 ? getHeatmapColor(count) : '#f3f4f6' }}
                    >
                      {count > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded hidden group-hover:block whitespace-nowrap z-20 shadow-lg">
                          {count} crise(s)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* GRÁFICO DE EVOLUÇÃO (COM BOTÃO 'DIÁRIO') */}
            <div className="card-elevated p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Evolução da Intensidade
                </h3>
                
                {/* AQUI ESTÃO OS BOTÕES ATUALIZADOS */}
                <div className="flex bg-secondary/30 p-1 rounded-lg self-start sm:self-auto">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        timeRange === range 
                          ? 'bg-white shadow-sm text-primary font-bold' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {range === 'daily' && 'Diário'} {/* Mudança aqui */}
                      {range === 'weekly' && 'Semanal'}
                      {range === 'monthly' && 'Mensal'}
                      {range === 'yearly' && 'Anual'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10, fill: '#6b7280' }} 
                      tickLine={false} 
                      axisLine={false} 
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      tick={{ fontSize: 10, fill: '#6b7280' }} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line 
                      type="monotone" 
                      dataKey="intensity" 
                      stroke="hsl(215, 45%, 20%)" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: 'hsl(215, 45%, 20%)' }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking de Locais */}
            <div className="card-elevated p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Locais de Risco
                </h3>
                
                {locationStats.length > 0 ? (
                    <div className="space-y-4">
                        {locationStats.map((item, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-foreground">{item.location}</span>
                                    <span className="text-muted-foreground">{item.count} crises ({item.percentage}%)</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-500" 
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-xl">
                        <MapPin className="w-8 h-8 mb-2 opacity-50" />
                        <p>Sem dados de local ainda.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Gatilhos e Lista (Mantido) */}
        {triggerStats.length > 0 && (
          <div className="card-elevated p-4">
            <h3 className="font-semibold text-foreground mb-4">Principais Gatilhos</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={triggerStats} dataKey="count" nameKey="trigger" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {triggerStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, TRIGGER_LABELS[name as keyof typeof TRIGGER_LABELS] || name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {triggerStats.slice(0, 5).map((t, i) => (
                <span key={t.trigger} className="text-xs flex items-center gap-1 bg-secondary/30 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {TRIGGER_LABELS[t.trigger as keyof typeof TRIGGER_LABELS] || t.trigger} ({t.percentage}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lista */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Histórico Completo</h3>
          <div className="space-y-3">
            {[...logs].reverse().slice(0, 20).map((event) => (
              <div key={event.id} className="card-elevated p-4">
                <div className="flex items-start gap-3">
                  <div className={`status-dot mt-1.5 ${EVENT_TYPE_COLORS[event.mood as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        {EVENT_TYPE_LABELS[event.mood as keyof typeof EVENT_TYPE_LABELS] || event.mood}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.date), 'dd/MM HH:mm')}
                      </span>
                    </div>
                    {event.location && (
                         <div className="flex items-center gap-1 mt-1 text-xs text-primary font-medium">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                         </div>
                    )}
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-muted-foreground">{event.notes}</p>
                        {event.intensity && <span className="text-xs font-bold bg-slate-100 px-2 rounded">Nível {event.intensity}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
