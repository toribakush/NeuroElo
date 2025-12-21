import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, MapPin, BarChart3, Pill, Plus, Trash2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const MOOD_COLORS: Record<string, string> = {
  bom_dia: '#22c55e',
  ansiedade: '#f97316',
  crise: '#ef4444',
  meltdown: '#a855f7',
  default: '#1e293b'
};

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

  useEffect(() => {
    if (patientId) {
      const fetchData = async () => {
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
      fetchData();
    }
  }, [patientId]);

  const handleAddMed = async () => {
    if (!newMedName) return;
    const { error } = await supabase.from('medications').insert({
      user_id: patientId,
      name: newMedName,
      dosage: newMedDose,
      time: newMedTime
    });
    if (!error) {
      setNewMedName(''); setNewMedDose(''); setNewMedTime('');
      const { data: m } = await supabase.from('medications').select('*').eq('user_id', patientId).order('created_at', { ascending: false });
      setMeds(m || []);
    }
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white p-4 border-b flex items-center gap-4">
        <button onClick={() => navigate('/')}><ArrowLeft /></button>
        <h1 className="text-xl font-bold">{patientName}</h1>
      </header>

      <main className="p-4 space-y-6 max-w-4xl mx-auto">
        <section className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="text-sm font-bold mb-4">Mapa de Calor (24h)</h3>
          <div className="flex flex-col gap-1">
            {heatmapData.map((day, i) => (
              <div key={i} className="flex gap-1 h-4">
                {day.map((m, h) => (
                  <div key={h} className="flex-1 rounded-sm" style={{ backgroundColor: m.length ? MOOD_COLORS[m[0]] : '#f1f5f9' }} />
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-4 rounded-xl shadow-sm border h-64">
           <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis domain={[0,10]} />
                <Tooltip />
                <Line type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={3} />
              </LineChart>
           </ResponsiveContainer>
        </section>

        <section className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Pill className="text-purple-500"/> Medicamentos</h3>
          <div className="flex flex-col gap-2 mb-4">
            <input className="border p-2 rounded" placeholder="Remédio" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Dose" value={newMedDose} onChange={e => setNewMedDose(e.target.value)} />
            <div className="flex gap-2">
              <input className="border p-2 rounded flex-1" placeholder="Hora" value={newMedTime} onChange={e => setNewMedTime(e.target.value)} />
              <button onClick={handleAddMed} className="bg-purple-600 text-white p-2 rounded px-4"><Plus/></button>
            </div>
          </div>
          <div className="space-y-2">
            {meds.map(m => (
              <div key={m.id} className="flex justify-between border-b py-2">
                <div>
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.dosage} - {m.time}</p>
                </div>
                <button onClick={async () => { await supabase.from('medications').delete().eq('id', m.id); window.location.reload(); }}><Trash2 className="w-4 h-4 text-red-400"/></button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;
