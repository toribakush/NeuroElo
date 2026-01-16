import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Search, MapPin, Check, Sparkles, CloudRain, Zap, AlertCircle, Smile, Heart, Coffee, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { dailyLogSchema } from '@/lib/validation';

const MOOD_OPTIONS = [
  { id: 'bom_dia', label: 'Feliz', color: 'bg-green-50', iconColor: 'text-green-500', icon: Smile },
  { id: 'calma', label: 'Calma', color: 'bg-orange-50', iconColor: 'text-orange-500', icon: Coffee },
  { id: 'ansiedade', label: 'Ansiedade', color: 'bg-purple-50', iconColor: 'text-purple-500', icon: CloudRain },
  { id: 'crise', label: 'Crise', color: 'bg-red-50', iconColor: 'text-red-500', icon: AlertCircle },
];

const TRIGGER_OPTIONS = [
  { id: 'barulho', label: 'Barulho', icon: Zap },
  { id: 'rotina', label: 'Rotina', icon: Moon },
  { id: 'fome', label: 'Fome/Sono', icon: Coffee },
  { id: 'frustracao', label: 'Frustração', icon: AlertCircle },
  { id: 'multidao', label: 'Multidão', icon: Heart },
  { id: 'estudos', label: 'Estudos', icon: Sparkles },
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

  const getIntensityColor = (val: number) => {
    if (val <= 3) return 'text-green-500';
    if (val <= 7) return 'text-orange-500';
    return 'text-red-500';
  };

  const handleSubmit = async () => {
    if (!mood) return toast({ title: "Selecione como você está se sentindo", variant: "destructive" });
    setLoading(true);
    
    try {
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
    <div className="min-h-screen bg-[#F5F5F5] pb-24 font-sans">
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          border: 2px solid #9333ea;
          margin-top: -10px;
          transition: all 0.2s ease;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #f1f5f9;
          border-radius: 10px;
        }
        input[type=range]:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 8px rgba(147, 51, 234, 0.1);
          transform: scale(1.1);
        }
      `}</style>

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">Hoje</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">15 de Janeiro</span>
        </div>
        <div className="w-10" />
      </header>

      <main className="px-6 mt-4 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 shadow-sm text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>

        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-white">
          <h3 className="text-slate-800 font-semibold text-center mb-8">Como você está se sentindo hoje?</h3>
          <div className="flex justify-between items-start gap-2">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMood(opt.id)}
                className="flex flex-col items-center gap-3 group"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  mood === opt.id 
                  ? 'bg-purple-600 text-white shadow-lg scale-110' 
                  : opt.color + ' ' + opt.iconColor + ' hover:scale-105'
                }`}>
                  <opt.icon size={28} strokeWidth={mood === opt.id ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-medium transition-colors ${mood === opt.id ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-white">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-slate-800 font-semibold">Intensidade</h3>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black transition-colors duration-300 ${getIntensityColor(intensity)}`}>
                {intensity}
              </span>
              <span className="text-slate-300 text-xs font-bold">/ 10</span>
            </div>
          </div>
          <div className="px-2 relative">
            <input 
              type="range" min="1" max="10" 
              value={intensity} 
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full appearance-none bg-transparent cursor-pointer"
            />
            <div className="flex justify-between mt-6 px-1">
              <div className="flex flex-col items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Leve</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Moderada</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Severa</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 font-semibold">O que desencadeou?</h3>
            <button className="text-xs font-bold text-pink-400 hover:text-pink-500 transition-colors">Editar</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTrigger(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${
                  selectedTriggers.includes(t.id)
                  ? 'bg-pink-50 border-pink-100 text-pink-600 shadow-sm'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                <t.icon size={14} className={selectedTriggers.includes(t.id) ? 'text-pink-500' : 'text-slate-300'} />
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-white flex items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <MapPin size={20} />
            </div>
            <input 
              placeholder="Onde aconteceu?" 
              className="flex-1 bg-transparent border-none py-4 px-4 text-sm text-slate-600 placeholder:text-slate-300 focus:ring-0 outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-white">
            <textarea 
              placeholder="Observações adicionais..." 
              rows={4}
              className="w-full bg-transparent border-none p-0 text-sm text-slate-600 placeholder:text-slate-300 focus:ring-0 outline-none resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        <div className="fixed bottom-8 left-6 right-6 z-20">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white h-16 rounded-[24px] font-bold text-lg shadow-2xl shadow-slate-400/50 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Check size={24} strokeWidth={3} /> Salvar Registro</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default LogEvent;
