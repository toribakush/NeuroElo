import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, MapPin, BarChart3, Pill, Plus, Trash2, Save, Calendar, User, Activity, Clock, Scale, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MedicationList } from '@/components/MedicationList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOOD_COLORS = {
  bom_dia: '#10b981',
  ansiedade: '#f59e0b',
  crise: '#ef4444',
  meltdown: '#8b5cf6',
  default: '#64748b'
};

const ProfessionalHome = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [logs, setLogs] = useState([]);
  const [meds, setMeds] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('');
  const [isSavingMed, setIsSavingMed] = useState(false);
  const [triggerStats, setTriggerStats] = useState([]);
  const [locationStats, setLocationStats] = useState([]);

  useEffect(() => {
    if (patientId) fetchAllData();
  }, [patientId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
      if (profile) setPatientName(profile.full_name);

      const { data: logsData } = await supabase.from('event_logs').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
      setLogs(logsData || []);

      const { data: medsData } = await supabase.from('medications').select('*').eq('patient_id', patientId).order('name');
      setMeds(medsData || []);

      processStats(logsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível carregar as informações do paciente." });
    } finally {
      setLoading(false);
    }
  };

  const processStats = (data) => {
    const triggers = {};
    const locations = {};
    data.forEach(log => {
      if (log.trigger) triggers[log.trigger] = (triggers[log.trigger] || 0) + 1;
      if (log.location_name) locations[log.location_name] = (locations[log.location_name] || 0) + 1;
    });

    setTriggerStats(Object.entries(triggers).map(([name, value]) => ({ name: TRIGGER_LABELS[name] || name, value })));
    setLocationStats(Object.entries(locations).map(([name, value]) => ({ name, value })));
  };

  const handleAddMedication = async () => {
    if (!newMedName || !newMedDose || !newMedTime) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos do medicamento.", variant: "destructive" });
      return;
    }

    try {
      setIsSavingMed(true);
      const { error } = await supabase.from('medications').insert({
        patient_id: patientId,
        name: newMedName,
        dosage: newMedDose,
        frequency: newMedTime,
        next_dose: newMedTime,
        stock: 30
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Medicamento adicionado com sucesso!" });
      setNewMedName('');
      setNewMedDose('');
      setNewMedTime('');
      fetchAllData();
    } catch (error) {
      console.error("Error adding medication:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível adicionar o medicamento." });
    } finally {
      setIsSavingMed(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Medicamento removido." });
      fetchAllData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao remover", description: "Não foi possível excluir o medicamento." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header Premium */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{patientName}</h1>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Prontuário Digital</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Seção de Medicamentos Refatorada */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-slate-900">Medicamentos</h2>
            <p className="text-sm text-slate-500 font-medium">Controle de receitas e dosagens atuais</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Formulário de Cadastro Premium */}
            <div className="lg:col-span-1">
              <Card className="border-none shadow-xl shadow-indigo-100/50 bg-white rounded-[32px] overflow-hidden">
                <CardHeader className="bg-slate-900 text-white pb-8 pt-8">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Plus size={18} />
                    </div>
                    Novo Medicamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 -mt-4 bg-white rounded-t-[32px] space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome do Remédio</label>
                      <div className="relative">
                        <Pill className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <Input 
                          placeholder="Ex: Ritalina, Risperidona..." 
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          className="pl-10 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Dosagem</label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <Input 
                            placeholder="10mg" 
                            value={newMedDose}
                            onChange={(e) => setNewMedDose(e.target.value)}
                            className="pl-10 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Horário</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <Input 
                            placeholder="08:00" 
                            value={newMedTime}
                            onChange={(e) => setNewMedTime(e.target.value)}
                            className="pl-10 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAddMedication}
                    disabled={isSavingMed}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {isSavingMed ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Salvar Medicamento
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Medicamentos Premium */}
            <div className="lg:col-span-2">
              <div className="bg-white/40 backdrop-blur-sm rounded-[32px] p-2 border border-white/60">
                <MedicationList medications={meds} onDelete={handleDeleteMedication} />
              </div>
            </div>
          </div>
        </section>

        {/* Outras seções (Gráficos e Logs) mantendo o estilo premium */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Activity className="text-indigo-600" size={20} />
                Análise de Comportamento
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="created_at" 
                    tickFormatter={(str) => format(new Date(str), 'dd/MM', { locale: ptBR })}
                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff'}}
                    activeDot={{r: 8, strokeWidth: 0}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <BarChart3 className="text-indigo-600" size={20} />
                Gatilhos Identificados
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={triggerStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {triggerStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'][index % 4]} cornerRadius={10} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalHome;
