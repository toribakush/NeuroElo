import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';

// Cores para o gráfico de pizza
const COLORS = ['hsl(215, 45%, 20%)', 'hsl(158, 40%, 45%)', 'hsl(32, 75%, 55%)', 'hsl(12, 60%, 55%)', 'hsl(280, 45%, 55%)', 'hsl(210, 20%, 70%)'];

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // Estados para armazenar os dados reais
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [triggerStats, setTriggerStats] = useState<any[]>([]);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // 1. Buscar o nome do paciente (Opcional: se você tiver salvo o nome na tabela profiles)
      // Se sua tabela profiles não tem 'full_name' ou 'name', essa parte pode vir vazia
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email') // Ajuste conforme as colunas da sua tabela profiles
        .eq('id', patientId)
        .single();
      
      if (profile) setPatientName(profile.full_name || profile.email || "Paciente");

      // 2. Buscar os logs do diário
      const { data: dailyLogs, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', patientId)
        .order('date', { ascending: true }); // Importante para o gráfico de linha

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

  // Função para transformar os dados brutos em dados de Gráfico
  const processCharts = (data: any[]) => {
    // A. Prepara dados para o Gráfico de Linha (Intensidade)
    const lineData = data.map(log => ({
      label: format(new Date(log.date), 'dd/MM'),
      intensity: log.intensity,
      fullDate: log.date
    }));
    setChartData(lineData);

    // B. Prepara dados para o Gráfico de Pizza (Gatilhos)
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
      .sort((a, b) => b.count - a.count); // Ordena do maior para o menor

    setTriggerStats(pieData);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="p-6">
         <header className="pb-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" /><span>Voltar</span>
          </button>
        </header>
        <div className="text-center mt-10">
          <h2 className="text-xl font-bold">{patientName}</h2>
          <p className="text-gray-500 mt-2">Nenhum registro encontrado para este paciente ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="p-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground mt-4">{patientName}</h1>
        {/* Lógica simples para mostrar dias sem crise (opcional) */}
        <p className="text-muted-foreground">Monitoramento em tempo real</p>
      </header>

      <main className="px-6 space-y-6">
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
            <div className="flex flex-wrap gap-2 mt-2">
              {triggerStats.slice(0, 5).map((t, i) => (
                <span key={t.trigger} className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {TRIGGER_LABELS[t.trigger as keyof typeof TRIGGER_LABELS] || t.trigger} ({t.percentage}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline (Logs Reais) */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Histórico Recente</h3>
          <div className="space-y-3">
            {/* Inverte a ordem para mostrar o mais recente primeiro no histórico */}
            {[...logs].reverse().slice(0, 10).map((event) => (
              <div key={event.id} className="card-elevated p-4">
                <div className="flex items-start gap-3">
                  {/* Usa a cor baseada no tipo (mood) */}
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
                       <span className="text-xs font-bold bg-slate-100 px-2 rounded">Nível {event.intensity}</span>
                    </div>
                    
                    {event.triggers && event.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.triggers.map((t: string) => (
                          <span key={t} className="text-2xs bg-muted px-2 py-0.5 rounded-full">
                            {TRIGGER_LABELS[t as keyof typeof TRIGGER_LABELS] || t}
                          </span>
                        ))}
                      </div>
                    )}
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
