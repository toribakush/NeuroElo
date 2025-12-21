import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';

const COLORS = ['hsl(215, 45%, 20%)', 'hsl(158, 40%, 45%)', 'hsl(32, 75%, 55%)', 'hsl(12, 60%, 55%)', 'hsl(280, 45%, 55%)', 'hsl(210, 20%, 70%)'];
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // [0, 1, ..., 23]

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [triggerStats, setTriggerStats] = useState<any[]>([]);
  // Novo estado para o Heatmap: Matriz 7 (dias) x 24 (horas)
  const [heatmapData, setHeatmapData] = useState<number[][]>([]); 
  const [maxCrisisCount, setMaxCrisisCount] = useState(0);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', patientId)
        .single();
      
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
    // A. Gráfico de Linha
    const lineData = data.map(log => ({
      label: format(new Date(log.date), 'dd/MM'),
      intensity: log.intensity,
      fullDate: log.date
    }));
    setChartData(lineData);

    // B. Gráfico de Pizza (Gatilhos)
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
    const pieData = Object.entries(triggerCounts)
      .map(([key, value]) => ({
        trigger: key,
        count: value,
        percentage: Math.round((value / totalTriggers) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    setTriggerStats(pieData);

    // C. NOVO: Heatmap (Mapa de Calor)
    // Inicializa matriz 7x24 com zeros
    const matrix = Array(7).fill(0).map(() => Array(24).fill(0));
    let maxCount = 0;

    data.forEach(log => {
      // Filtra apenas crises ou considera todos com intensidade alta?
      // Aqui vou considerar logs marcados como 'crise'
      if (log.mood === 'crise') {
        const date = new Date(log.date);
        const day = date.getDay(); // 0 (Domingo) a 6 (Sábado)
        const hour = date.getHours(); // 0 a 23
        
        matrix[day][hour] += 1;
        if (matrix[day][hour] > maxCount) maxCount = matrix[day][hour];
      }
    });

    setHeatmapData(matrix);
    setMaxCrisisCount(maxCount);
  };

  // Função auxiliar para calcular a cor do bloco do heatmap
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-100'; // Sem crise
    // Calcula opacidade baseada na quantidade em relação ao máximo
    // Mínimo de 0.2 para aparecer se tiver 1 crise
    const opacity = Math.max(0.3, Math.min(1, count / (maxCrisisCount || 1)));
    return `rgba(239, 68, 68, ${opacity})`; // Vermelho (Tailwind red-500)
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
        
        {/* 1. Heatmap Card (NOVO) */}
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
            <div className="min-w-[600px]"> {/* Garante largura mínima para não espremer */}
              
              {/* Cabeçalho das Horas */}
              <div className="flex mb-1">
                <div className="w-10"></div> {/* Espaço para labels dos dias */}
                {HOURS.map(h => (
                  <div key={h} className="flex-1 text-[10px] text-center text-muted-foreground">
                    {h}h
                  </div>
                ))}
              </div>

              {/* Grid de Dias e Blocos */}
              {heatmapData.map((dayData, dayIndex) => (
                <div key={dayIndex} className="flex items-center mb-1 h-6">
                  {/* Label do Dia */}
                  <div className="w-10 text-[10px] font-medium text-muted-foreground">
                    {DAYS_OF_WEEK[dayIndex]}
                  </div>
                  
                  {/* Blocos das 24 horas */}
                  {dayData.map((count, hourIndex) => (
                    <div 
                      key={hourIndex} 
                      className="flex-1 h-full mx-[1px] rounded-sm transition-all hover:scale-125 hover:z-10 relative group"
                      style={{ 
                        backgroundColor: count > 0 ? getHeatmapColor(count) : '#f3f4f6',
                        border: count > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
                      }}
                    >
                      {/* Tooltip simples ao passar o mouse */}
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
          <div className="flex justify-between items-center mt-2 px-2">
            <span className="text-xs text-muted-foreground">Madrugada (00h)</span>
            <span className="text-xs text-muted-foreground">Meio-dia (12h)</span>
            <span className="text-xs text-muted-foreground">Noite (23h)</span>
          </div>
        </div>

        {/* 2. Intensity Chart */}
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-foreground mb-4">Evolução da Intensidade</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#6b7280', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="intensity" stroke="hsl(215, 45%, 20%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Triggers Pie Chart */}
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

        {/* 4. Logs Reais */}
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
