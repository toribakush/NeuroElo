import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info, MapPin, AlertCircle, Sparkles, CloudRain, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { dailyLogSchema } from '@/lib/validation';
import { z } from 'zod';

// Configuração de cores pastel e ícones como na referência
const MOOD_OPTIONS = [
  { id: 'bom_dia', label: 'Bom Dia', color: 'bg-[#DCFCE7]', text: 'text-[#166534]', icon: Sparkles },
  { id: 'ansiedade', label: 'Ansiedade', color: 'bg-[#FFEDD5]', text: 'text-[#9A3412]', icon: CloudRain },
  { id: 'meltdown', label: 'Meltdown', color: 'bg-[#F3E8FF]', text: 'text-[#6B21A8]', icon: Zap },
  { id: 'crise', label: 'Crise', color: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', icon: AlertCircle },
];

const TRIGGER_OPTIONS = [
  { id: 'barulho', label: 'Barulho' },
  { id: 'mudanca_rotina', label: 'Rotina' },
  { id: 'fome_sono', label: 'Fome/Sono' },
  { id: 'frustracao', label: 'Frustração' },
  { id: 'multidao', label: 'Multidão' },
  { id: 'estudos', label: 'Estudos' },
];

const LogEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [mood, setMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTrigger = (id: string) => {
    setSelectedTriggers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!mood) return toast({ title: "Selecione o estado", variant: "destructive" });
    setLoading(true);
    
    try {
      // Validate input before submission
      const validation = dailyLogSchema.safeParse({
        mood,
        intensity,
        triggers: selectedTriggers,
        location,
        notes,
      });
      
      if (!validation.success) {
        toast({ 
          title: "Dados inválidos", 
          description: validation.error.errors[0].message,
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('daily_logs').insert({
        user_id: user?.id,
        mood: validation.data.mood,
        intensity: validation.data.intensity,
        triggers: validation.data.triggers,
        location: validation.data.location || null,
        notes: validation.data.notes || null,
        date: new Date().toISOString()
      });
      if (error) throw error;
      toast({ title: "Registro salvo com sucesso!" });
      navigate('/');
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <header className="p-6 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Novo Registro</h1>
      </header>

      <main className="px-6 space-y-6">
        
        {/* Card 1: Como você está? */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
            Como foi o evento?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMood(opt.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all border-2 ${
                  mood === opt.id ? 'border-slate-900 shadow-md' : 'border-transparent ' + opt.color
                }`}
              >
                <div className={`p-2 rounded-full bg-white/50 ${opt.text}`}>
                  <opt.icon size={20} />
                </div>
                <span className={`text-sm font-bold ${opt.text}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Card 2: Intensidade (Slider Circular Style) */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 font-bold">Intensidade</h3>
            <span className="text-2xl font-black text-slate-900">{intensity}</span>
          </div>
          <input 
            type="range" min="1" max="10" 
            value={intensity} 
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-full appearance-none accent-slate-900"
          />
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Leve</span>
            <span>Severa</span>
          </div>
        </section>

        {/* Card 3: Gatilhos (Tags/Chips) */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="text-slate-800 font-bold mb-4">O que desencadeou?</h3>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTrigger(t.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedTriggers.includes(t.id)
                  ? 'bg-slate-900 text-white shadow-lg translate-y-[-2px]'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Card 4: Detalhes extras */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              placeholder="Onde aconteceu?" 
              className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <textarea 
            placeholder="Observações adicionais..." 
            rows={3}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-slate-900 text-white h-14 rounded-[24px] font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Salvando...' : <><Check size={24} /> Salvar Registro</>}
        </button>
      </main>
    </div>
  );
};

export default LogEvent;
