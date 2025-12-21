import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Pill, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PatientDashboard = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [meds, setMeds] = useState<any[]>([]);
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '' });

  const loadData = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      // Busca Nome do Paciente
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
      setPatientName(profile?.full_name || "Paciente");

      // Busca Medicamentos
      const { data: m } = await supabase.from('medications').select('*').eq('user_id', patientId).order('created_at', { ascending: false });
      setMeds(m || []);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [patientId]);

  const handleAddMed = async () => {
    if (!newMed.name) return;
    const { error } = await supabase.from('medications').insert({
      user_id: patientId,
      name: newMed.name,
      dosage: newMed.dose,
      time: newMed.time
    });
    if (!error) {
      setNewMed({ name: '', dose: '', time: '' });
      loadData();
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary w-10 h-10 mb-2" />
      <p className="text-slate-400 text-sm">Carregando informações...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{patientName}</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-700">
          Modo de diagnóstico: Gráficos pausados para estabilizar a visualização de medicamentos.
        </div>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Pill className="text-purple-500 w-5 h-5"/> Medicamentos do Paciente
          </h3>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 mb-6">
            <input 
              className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" 
              placeholder="Remédio" 
              value={newMed.name} 
              onChange={e => setNewMed({...newMed, name: e.target.value})} 
            />
            <div className="flex gap-2">
              <input 
                className="flex-1 border border-slate-200 p-2.5 rounded-lg text-sm" 
                placeholder="Dose" 
                value={newMed.dose} 
                onChange={e => setNewMed({...newMed, dose: e.target.value})} 
              />
              <input 
                className="flex-1 border border-slate-200 p-2.5 rounded-lg text-sm" 
                placeholder="Hora" 
                value={newMed.time} 
                onChange={e => setNewMed({...newMed, time: e.target.value})} 
              />
              <button 
                onClick={handleAddMed} 
                className="bg-purple-600 text-white p-2.5 rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {meds.map(m => (
              <div key={m.id} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{m.dosage} • {m.time}</p>
                </div>
                <button 
                  onClick={async () => { await supabase.from('medications').delete().eq('id', m.id); loadData(); }}
                  className="text-slate-300 hover:text-red-500 p-2"
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
