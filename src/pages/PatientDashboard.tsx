import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Pill, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PatientDashboard = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("Carregando...");
  const [meds, setMeds] = useState<any[]>([]);
  
  // Estados simples para medicamentos
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('');

  // Função única de carregamento para evitar erros de renderização
  useEffect(() => {
    if (!patientId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Busca Perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', patientId)
          .single();
        
        if (profile) setPatientName(profile.full_name || "Paciente");

        // Busca Medicamentos
        const { data: m } = await supabase
          .from('medications')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false });
        
        setMeds(m || []);
      } catch (e) {
        console.error("Erro crítico:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      window.location.reload(); // Recarrega para limpar o estado com segurança
    }
  };

  const handleDeleteMed = async (id: string) => {
    if (!confirm("Remover medicamento?")) return;
    await supabase.from('medications').delete().eq('id', id);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white p-4 border-b flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{patientName}</h1>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Aviso de Gráficos (Removidos temporariamente para estabilizar) */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-700 text-sm">
          Painel estabilizado. Os gráficos serão reativados após o teste dos medicamentos.
        </div>

        {/* Seção de Medicamentos */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-purple-600">
            <Pill className="w-5 h-5" />
            <h3 className="font-bold text-lg">Plano de Medicamentos</h3>
          </div>

          <div className="flex flex-col gap-3 mb-6 bg-slate-50 p-4 rounded-xl">
            <input 
              className="border p-2.5 rounded-lg text-sm bg-white" 
              placeholder="Nome do Remédio" 
              value={newMedName} 
              onChange={e => setNewMedName(e.target.value)} 
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                className="border p-2.5 rounded-lg text-sm bg-white" 
                placeholder="Dosagem" 
                value={newMedDose} 
                onChange={e => setNewMedDose(e.target.value)} 
              />
              <input 
                className="border p-2.5 rounded-lg text-sm bg-white" 
                placeholder="Horário" 
                value={newMedTime} 
                onChange={e => setNewMedTime(e.target.value)} 
              />
            </div>
            <button 
              onClick={handleAddMed} 
              className="bg-purple-600 text-white font-bold p-3 rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar ao Prontuário
            </button>
          </div>

          <div className="space-y-3">
            {meds.length === 0 ? (
              <p className="text-center text-slate-400 py-4 text-sm">Nenhum medicamento ativo.</p>
            ) : (
              meds.map(m => (
                <div key={m.id} className="flex justify-between items-center border p-4 rounded-xl bg-white hover:border-purple-200 transition-colors shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{m.dosage} — {m.time}</p>
                  </div>
                  <button onClick={() => handleDeleteMed(m.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;
