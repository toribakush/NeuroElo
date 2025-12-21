import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Pill, Plus, Trash2, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const MOOD_COLORS: Record<string, string> = {
  bom_dia: '#22c55e',
  ansiedade: '#f97316',
  crise: '#ef4444',
  meltdown: '#a855f7',
  default: '#64748b'
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PatientDashboard = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('');

  const fetchData = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
      setPatientName(profile?.full_name || "Paciente");

      const { data: l } = await supabase.from('daily_logs').select('*').eq('user_id', patientId).order('date', { ascending: true });
      setLogs(l || []);

      const { data: m } = await supabase.from('medications').select('*').eq('user_id', patientId).order('created_at', { ascending: false });
      setMeds(m || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleAddMed = async () => {
    if (!newMedName) return;
    await supabase.from('medications').insert({
      user_id: patientId,
      name: newMedName,
      dosage: newMedDose,
      time: newMedTime
    });
    setNewMedName(''); setNewMedDose(''); setNewMedTime('');
    fetchData();
  };

  const heatmapData = useMemo(() => {
    const matrix: string[][][] = Array(7).fill(0).map(() => Array(24).fill(0).map(() => []));
    logs.forEach(log => {
      const d = new Date(log.date);
      if (!isNaN(d.getTime())) matrix[d.getDay()][d.getHours()].push(log.mood);
    });
    return matrix;
  }, [logs]);

  const chartData = useMemo(() => {
    const today = new Date();
    return logs
      .filter(l => isSameDay(new Date(l.date), today))
      .map(log => ({ 
        label: format(new Date(log.date), 'HH:mm'), 
        intensity: log.intensity, 
        mood: log.mood 
      }));
  }, [logs]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10 mb-4" />
      <p className="text-slate-500 font-medium">Carregando prontuário...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{patientName}</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Mapa de Calor */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Horários de Crise
          </h3>
          <div className="flex flex-col gap-1.5">
            {heatmapData.map((day, i) => (
              <div key={i} className="flex gap-1 items-center">
                <span className="w-8 text-[10px] font-bold text-slate-400">{DAYS_OF_WEEK[i]}</span>
                {day.map((m, h) => (
                  <div 
                    key={h} 
                    className="flex-1 h-5 rounded-sm transition-colors" 
                    style={{ backgroundColor: m.length ? MOOD_COLORS[m[0]] || MOOD_COLORS.default : '#f1f5f9' }}
                    title={`${h}h: ${m.length} eventos`}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Gráfico de Linha */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-80">
           <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Evolução da Intensidade (Hoje)</h3>
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis domain={[0,10]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip />
                <Line type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
           </ResponsiveContainer>
        </section>

        {/* Medicamentos */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Pill className="text-purple-500 w-5 h-5"/> Medicamentos do Paciente
          </h3>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3 mb-6">
            <input 
              className="w-full border border-purple-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
              placeholder="Nome do Medicamento" 
              value={newMedName} 
              onChange={e => setNewMedName(e.target.value)} 
            />
            <div className="flex gap-2">
              <input 
                className="flex-1 border border-purple-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="Dosagem (ex: 10mg)" 
                value={newMedDose} 
                onChange={e => setNewMedDose(e.target.value)} 
              />
              <input 
                className="flex-1 border border-purple-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="Horário (ex: 08:00)" 
                value={newMedTime} 
                onChange={e => setNewMedTime(e.target.value)} 
              />
              <button 
                onClick={handleAddMed} 
                className="bg-purple-600 text-white p-2.5 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meds.map(m => (
              <div key={m.id} className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm group hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{m.dosage} • {m.time}</p>
                  </div>
                </div>
                <button 
                  onClick={async () => { await supabase.from('medications').delete().eq('id', m.id); fetchData(); }}
                  className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;
