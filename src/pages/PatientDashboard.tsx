import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, MapPin } from 'lucide-react'; // Adicionei MapPin
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';

const COLORS = ['hsl(215, 45%, 20%)', 'hsl(158, 40%, 45%)', 'hsl(32, 75%, 55%)', 'hsl(12, 60%, 55%)', 'hsl(280, 45%, 55%)', 'hsl(210, 20%, 70%)'];
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [triggerStats, setTriggerStats] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]); 
  const [maxCrisisCount, setMaxCrisisCount] = useState(0);
  
  // NOVO: Estado para estatísticas de Local
  const [locationStats, setLocationStats] = useState<any[]>([]);

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
        processCharts(dailyLogs);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const processCharts = (data: any[]) => {
    // A. Linha (Intensidade)
    const lineData = data.map(log => ({
      label: format(new Date(log.date), 'dd/MM'),
      intensity: log.intensity,
      fullDate: log.date
    }));
    setChartData(lineData);

    // B. Pizza (Gatilhos)
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

    // C. Heatmap
    const matrix = Array(7).fill(0).map(() => Array(24).fill(0));
    let maxCount = 0;
    data.forEach(log => {
      if (log.mood === 'crise') {
        const d = new Date(log.date);
        const day = d.getDay();
        const hour = d.getHours();
        matrix[day][hour]++;
        if (matrix[day][hour] > maxCount) maxCount = matrix[day][hour];
      }
    });
    setHeatmapData(matrix);
    setMaxCrisisCount(maxCount);

    // D. NOVO: Ranking de Locais (Considerando apenas crises)
    const locationCounts: Record<string, number> = {};
    let totalCrisesWithLocation = 0;

    data.forEach(log => {
      // Filtra apenas crises que tenham local preenchido
      if (log.mood === 'crise' && log.location) {
        // Normaliza o texto (ex: "casa" virar "Casa")
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
      .sort((a, b) => b.count - a.count) // Ordena do maior para o menor
      .slice(0, 5); // Pega o Top 5

    setLocationStats(locStats);
  };

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
        <p className="text-muted-foreground">Análise detalhada de comportamento</p>
      </header>

      <main className="px-6 space-y-6">
        
        {/* Heatmap */}
        <div className="card-elevated p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-foreground">Mapa de Calor: Horários de Crise</h3>
            <div className="group relative">
               <Info className="w-4 h-4 text-muted-foreground cursor-help"/>
               <span className="absolute left-6 top-0 w-48 text-xs bg-black text-white p-2 rounded hidden group-hover:block z-10">
                 Quanto mais vermelho, mais crises ocorreram nesse dia e horário.
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
                          {count} crise(s) às {hourIndex}h
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
            {/* Intensity Chart */}
            <div className="card-elevated p-4">
              <h3 className="font-semibold text-foreground mb-4">Evolução da Intensidade</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="intensity" stroke="hsl(215, 45%, 20%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* NOVO: RANKING DE LOCAIS */}
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

        {/* Triggers Pie Chart */}
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

        {/* Logs List */}
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
                    
                    {/* Exibe o Local na lista também */}
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
